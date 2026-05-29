import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/server/db/prisma";
import { applyAdminAllowlistRole } from "@/server/auth/provisioning";
import { UserRole } from "@/server/auth/roles";
import { getServerEnv } from "@/server/config/env";

export interface GoogleProviderCredentials {
  clientId: string;
  clientSecret: string;
}

function getOptionalSecret(): string | undefined {
  return getServerEnv().AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}

export function getGoogleProviderCredentials(
  input: Record<string, string | undefined> = process.env,
): GoogleProviderCredentials | null {
  const env = getServerEnv(input);

  if (!env.AUTH_GOOGLE_ID || !env.AUTH_GOOGLE_SECRET) {
    return null;
  }

  return {
    clientId: env.AUTH_GOOGLE_ID,
    clientSecret: env.AUTH_GOOGLE_SECRET,
  };
}

const googleCredentials = getGoogleProviderCredentials();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(
    prisma as unknown as Parameters<typeof PrismaAdapter>[0],
  ),
  secret: getOptionalSecret(),
  session: {
    strategy: "database",
  },
  providers: googleCredentials
    ? [
    GoogleProvider({
          clientId: googleCredentials.clientId,
          clientSecret: googleCredentials.clientSecret,
    }),
      ]
    : [],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? UserRole.CUSTOMER;
      }

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) {
        return;
      }

      await applyAdminAllowlistRole({
        userId: user.id,
        email: user.email,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
      });
    },
  },
};

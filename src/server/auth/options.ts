import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/server/db/prisma";
import { applyAdminAllowlistRole } from "@/server/auth/provisioning";
import { UserRole } from "@/server/auth/roles";

function getOptionalSecret(): string | undefined {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}

function getGoogleClientId(): string {
  return (
    process.env.AUTH_GOOGLE_ID ??
    process.env.GOOGLE_CLIENT_ID ??
    "missing-google-client-id"
  );
}

function getGoogleClientSecret(): string {
  return (
    process.env.AUTH_GOOGLE_SECRET ??
    process.env.GOOGLE_CLIENT_SECRET ??
    "missing-google-client-secret"
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(
    prisma as unknown as Parameters<typeof PrismaAdapter>[0],
  ),
  secret: getOptionalSecret(),
  session: {
    strategy: "database",
  },
  providers: [
    GoogleProvider({
      clientId: getGoogleClientId(),
      clientSecret: getGoogleClientSecret(),
    }),
  ],
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

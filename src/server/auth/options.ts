import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/server/db/prisma";
import { applyAdminAllowlistRole } from "@/server/auth/provisioning";
import { credentialsLoginSchema } from "@/server/auth/auth-schemas";
import { authorizeCredentials } from "@/server/auth/registration-service";
import { UserRole } from "@/server/auth/roles";
import { getServerEnv } from "@/server/config/env";
import { enforceRateLimit } from "@/server/lib/rate-limit";

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

function headerValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  const value = headers?.[key] ?? headers?.[key.toLowerCase()];

  return Array.isArray(value) ? value[0] : value;
}

function getCredentialsRequestIp(request: {
  headers?: Record<string, string | string[] | undefined>;
}): string {
  const forwardedFor = headerValue(request.headers, "x-forwarded-for");

  return (
    headerValue(request.headers, "cf-connecting-ip") ??
    headerValue(request.headers, "x-real-ip") ??
    forwardedFor?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function hasVerifiedGoogleEmail(profile: unknown): boolean {
  return (
    typeof profile === "object" &&
    profile !== null &&
    "email_verified" in profile &&
    (profile as { email_verified?: unknown }).email_verified === true
  );
}

export function shouldApplyAdminAllowlist(input: {
  accountProvider?: string;
  profile?: unknown;
}): boolean {
  return (
    input.accountProvider === "google" && hasVerifiedGoogleEmail(input.profile)
  );
}

const googleCredentials = getGoogleProviderCredentials();
const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      const parsedCredentials = credentialsLoginSchema.safeParse(credentials);

      if (!parsedCredentials.success) {
        return null;
      }

      enforceRateLimit({
        key: `credentials:${getCredentialsRequestIp(request)}:${parsedCredentials.data.email}`,
        limit: 10,
        windowMs: 15 * 60_000,
      });

      return authorizeCredentials(parsedCredentials.data);
    },
  }),
];

if (googleCredentials) {
  providers.push(
    GoogleProvider({
      clientId: googleCredentials.clientId,
      clientSecret: googleCredentials.clientSecret,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(
    prisma as unknown as Parameters<typeof PrismaAdapter>[0],
  ),
  secret: getOptionalSecret(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? UserRole.CUSTOMER;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? UserRole.CUSTOMER;
      }

      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (!user.id) {
        return;
      }

      if (
        shouldApplyAdminAllowlist({
          accountProvider: account?.provider,
          profile,
        })
      ) {
        await applyAdminAllowlistRole({
          userId: user.id,
          email: user.email,
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
      });
    },
  },
};

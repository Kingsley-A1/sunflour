import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/server/db/prisma";
import { applyAdminAllowlistRole } from "@/server/auth/provisioning";
import { credentialsLoginSchema } from "@/server/auth/auth-schemas";
import { authorizeCredentials } from "@/server/auth/registration-service";
import { getGoogleProviderCredentials } from "@/server/auth/google-oauth";
import { UserRole } from "@/server/auth/roles";
import { getServerEnv } from "@/server/config/env";
import { enforceRateLimit } from "@/server/lib/rate-limit";

function getOptionalSecret(): string | undefined {
  return getServerEnv().AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
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

export function parseCredentialsProviderInput(
  credentials: Record<string, unknown> | undefined,
) {
  return credentialsLoginSchema.safeParse({
    email: credentials?.email,
    password: credentials?.password,
  });
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
const credentialsProvider = CredentialsProvider({
  name: "Email and password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials, request) {
    const parsedCredentials = parseCredentialsProviderInput(credentials);

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
});
const providers: NextAuthOptions["providers"] = googleCredentials
  ? [
      GoogleProvider({
        clientId: googleCredentials.clientId,
        clientSecret: googleCredentials.clientSecret,
        allowDangerousEmailAccountLinking: true,
      }),
      credentialsProvider,
    ]
  : [credentialsProvider];

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
    signIn({ account, profile }) {
      if (account?.provider === "google") {
        return hasVerifiedGoogleEmail(profile);
      }

      return true;
    },
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

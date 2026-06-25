import { describe, expect, it } from "vitest";
import {
  authOptions,
  parseCredentialsProviderInput,
  shouldApplyAdminAllowlist,
} from "@/server/auth/options";
import { getGoogleProviderCredentials } from "@/server/auth/google-oauth";

describe("NextAuth options helpers", () => {
  it("puts Google OAuth before credentials when configured", () => {
    expect(authOptions.providers.map((provider) => provider.id)).toEqual([
      "google",
      "credentials",
    ]);
  });

  it("allows verified Google email account linking", () => {
    expect(authOptions.providers[0]).toMatchObject({
      id: "google",
      options: {
        allowDangerousEmailAccountLinking: true,
      },
    });
  });

  it("detects complete Google OAuth credentials only", () => {
    expect(
      getGoogleProviderCredentials({
        AUTH_GOOGLE_ID: "google-client-id",
        AUTH_GOOGLE_SECRET: "google-client-secret",
      }),
    ).toEqual({
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
    });

    expect(getGoogleProviderCredentials({})).toBeNull();
    expect(() =>
      getGoogleProviderCredentials({
        AUTH_GOOGLE_ID: "google-client-id",
      }),
    ).toThrow();
  });

  it("parses only email and password from NextAuth credentials payloads", () => {
    const result = parseCredentialsProviderInput({
      email: " ADMIN@Example.com ",
      password: "Sunflour@2026",
      csrfToken: "csrf-token",
      callbackUrl: "/admin",
      json: "true",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      email: "admin@example.com",
      password: "Sunflour@2026",
    });
  });

  it("allows admin allowlist provisioning only for verified Google OAuth", () => {
    expect(
      shouldApplyAdminAllowlist({
        accountProvider: "google",
        profile: { email_verified: true },
      }),
    ).toBe(true);
    expect(
      shouldApplyAdminAllowlist({
        accountProvider: "credentials",
        profile: { email_verified: true },
      }),
    ).toBe(false);
    expect(
      shouldApplyAdminAllowlist({
        accountProvider: "google",
        profile: { email_verified: false },
      }),
    ).toBe(false);
  });

  it("rejects unverified Google OAuth sign-ins before account linking", async () => {
    const signIn = authOptions.callbacks?.signIn;

    expect(signIn).toBeDefined();

    expect(
      await signIn?.({
        account: { provider: "google", type: "oauth", providerAccountId: "1" } as never,
        credentials: undefined,
        email: undefined,
        profile: { email_verified: false } as never,
        user: { id: "user_1" } as never,
      }),
    ).toBe(false);

    expect(
      await signIn?.({
        account: { provider: "google", type: "oauth", providerAccountId: "1" } as never,
        credentials: undefined,
        email: undefined,
        profile: { email_verified: true } as never,
        user: { id: "user_1" } as never,
      }),
    ).toBe(true);
  });
});

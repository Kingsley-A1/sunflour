import { describe, expect, it } from "vitest";
import { authOptions, shouldApplyAdminAllowlist } from "@/server/auth/options";
import { getGoogleProviderCredentials } from "@/server/auth/google-oauth";

describe("NextAuth options helpers", () => {
  it("puts Google OAuth before credentials when configured", () => {
    expect(authOptions.providers.map((provider) => provider.id)).toEqual([
      "google",
      "credentials",
    ]);
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
});

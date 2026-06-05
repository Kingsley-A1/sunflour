import { describe, expect, it } from "vitest";
import { shouldApplyAdminAllowlist } from "@/server/auth/options";

describe("NextAuth options helpers", () => {
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

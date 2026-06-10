import { describe, expect, it } from "vitest";
import { resolveSafeAuthCallbackUrl } from "@/lib/auth/callback-url";

describe("auth callback URL handling", () => {
  it("keeps internal callback URLs", () => {
    expect(resolveSafeAuthCallbackUrl("/checkout")).toBe("/checkout");
    expect(resolveSafeAuthCallbackUrl(["/account/orders"])).toBe(
      "/account/orders",
    );
  });

  it("falls back for external or missing callback URLs", () => {
    expect(resolveSafeAuthCallbackUrl("https://example.com")).toBe("/account");
    expect(resolveSafeAuthCallbackUrl("//example.com")).toBe("/account");
    expect(resolveSafeAuthCallbackUrl(undefined, "/menu")).toBe("/menu");
  });
});

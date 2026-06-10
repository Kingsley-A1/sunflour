import { describe, expect, it } from "vitest";
import {
  publicMobileNavItems,
  signedInMobileNavItems,
  signedOutMobileNavItems,
} from "@/components/layout/public-mobile-navigation";

describe("public mobile navigation", () => {
  it("keeps public page links in customer priority order", () => {
    expect(publicMobileNavItems.map((item) => item.label)).toEqual([
      "Menu",
      "Cart",
      "Checkout",
      "Reviews",
      "About",
      "Contact",
      "Privacy",
      "Terms",
    ]);
  });

  it("separates signed-out and signed-in account links", () => {
    expect(signedOutMobileNavItems.map((item) => item.label)).toEqual([
      "Sign in",
      "Register",
    ]);
    expect(signedInMobileNavItems.map((item) => item.label)).toEqual([
      "Account",
      "Orders",
    ]);
  });
});

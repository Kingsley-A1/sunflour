import { describe, expect, it } from "vitest";
import { publicMobileNavItems } from "@/components/layout/public-mobile-navigation";

describe("public mobile navigation", () => {
  it("keeps page links in customer priority order", () => {
    expect(publicMobileNavItems.map((item) => item.label)).toEqual([
      "Menu",
      "Cart",
      "Checkout",
      "Sign in",
      "Register",
      "Account",
      "Orders",
      "Reviews",
      "About",
      "Contact",
      "Privacy",
      "Terms",
    ]);
  });
});

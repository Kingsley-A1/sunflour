import { describe, expect, it } from "vitest";
import {
  getAdminAllowlistRoleForEmail,
  parseAdminAllowlist,
} from "@/server/auth/admin-allowlist";
import { UserRole } from "@/server/auth/roles";

describe("admin allowlist", () => {
  it("parses allowed admin emails and roles", () => {
    const entries = parseAdminAllowlist(
      "OWNER@EXAMPLE.COM:SUPER_ADMIN, manager@example.com:moderator",
    );

    expect(entries).toEqual([
      { email: "owner@example.com", role: UserRole.SUPER_ADMIN },
      { email: "manager@example.com", role: UserRole.MODERATOR },
    ]);
  });

  it("rejects non-admin roles", () => {
    expect(() =>
      parseAdminAllowlist("customer@example.com:CUSTOMER"),
    ).toThrow();
  });

  it("returns the allowlisted role for an email", () => {
    expect(
      getAdminAllowlistRoleForEmail(
        "Owner@Example.com",
        "owner@example.com:SUPER_ADMIN",
      ),
    ).toBe(UserRole.SUPER_ADMIN);
  });
});

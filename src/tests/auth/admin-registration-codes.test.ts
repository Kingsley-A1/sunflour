import { describe, expect, it } from "vitest";
import {
  generateAdminRegistrationCode,
  verifyAdminRegistrationCode,
} from "@/server/auth/admin-registration-codes";
import { UserRole } from "@/server/auth/roles";

const secret = "12345678901234567890123456789012";

describe("admin registration codes", () => {
  it("generates 6-digit role-scoped codes", () => {
    const code = generateAdminRegistrationCode({
      role: UserRole.SUPER_ADMIN,
      secret,
      date: new Date("2026-06-01T00:00:00.000Z"),
    });

    expect(code).toMatch(/^[0-9]{6}$/);
    expect(
      verifyAdminRegistrationCode({
        role: UserRole.SUPER_ADMIN,
        code,
        secret,
        date: new Date("2026-06-01T00:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("rejects role-mismatched and expired codes", () => {
    const code = generateAdminRegistrationCode({
      role: UserRole.MODERATOR,
      secret,
      date: new Date("2026-06-01T00:00:00.000Z"),
    });

    expect(
      verifyAdminRegistrationCode({
        role: UserRole.MEDIA_MANAGER,
        code,
        secret,
        date: new Date("2026-06-01T00:00:00.000Z"),
      }),
    ).toBe(false);
    expect(
      verifyAdminRegistrationCode({
        role: UserRole.MODERATOR,
        code,
        secret,
        date: new Date("2026-06-09T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("changes active codes when a rotation nonce is used", () => {
    const date = new Date("2026-06-01T00:00:00.000Z");
    const firstCode = generateAdminRegistrationCode({
      role: UserRole.SUPER_ADMIN,
      secret,
      date,
      rotationNonce: "rotation-one",
    });
    const secondCode = generateAdminRegistrationCode({
      role: UserRole.SUPER_ADMIN,
      secret,
      date,
      rotationNonce: "rotation-two",
    });

    expect(secondCode).toMatch(/^[0-9]{6}$/);
    expect(secondCode).not.toBe(firstCode);
    expect(
      verifyAdminRegistrationCode({
        role: UserRole.SUPER_ADMIN,
        code: firstCode,
        secret,
        date,
        rotationNonce: "rotation-two",
      }),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildAdminRegistrationCodePanel,
  type AdminRegistrationCodeRotationState,
} from "@/server/auth/admin-registration-code-service";

const secret = "12345678901234567890123456789012";
const date = new Date("2026-06-01T00:00:00.000Z");

function state(input: Partial<AdminRegistrationCodeRotationState>) {
  return {
    version: 0,
    nonce: "",
    rotatedAt: null,
    rotatedByUserId: null,
    ...input,
  } satisfies AdminRegistrationCodeRotationState;
}

describe("admin registration code service", () => {
  it("builds role-specific code panels without exposing nonce or secret", () => {
    const panel = buildAdminRegistrationCodePanel({
      state: state({ version: 3, nonce: "rotation-three" }),
      secret,
      date,
    });

    expect(panel.version).toBe(3);
    expect(panel.codes).toHaveLength(4);
    expect(panel.codes.every((item) => /^[0-9]{6}$/.test(item.code))).toBe(
      true,
    );
    expect(JSON.stringify(panel)).not.toContain(secret);
    expect(JSON.stringify(panel)).not.toContain("rotation-three");
  });

  it("returns deterministic but different panels after rotation changes", () => {
    const firstPanel = buildAdminRegistrationCodePanel({
      state: state({ nonce: "first-rotation" }),
      secret,
      date,
    });
    const secondPanel = buildAdminRegistrationCodePanel({
      state: state({ version: 1, nonce: "second-rotation" }),
      secret,
      date,
    });

    expect(secondPanel.codes.map((item) => item.code)).not.toEqual(
      firstPanel.codes.map((item) => item.code),
    );
  });
});

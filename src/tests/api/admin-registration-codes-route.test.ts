import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET as getRegistrationCodesRoute,
  POST as rotateRegistrationCodesRoute,
} from "@/app/api/v1/admin/admin-registration-codes/route";
import { requireRole } from "@/server/auth/rbac";
import { UserRole } from "@/server/auth/roles";
import {
  getAdminRegistrationCodePanel,
  rotateAdminRegistrationCodes,
} from "@/server/auth/admin-registration-code-service";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  getAdminRegistrationCodePanel: vi.fn(),
  rotateAdminRegistrationCodes: vi.fn(),
}));

vi.mock("@/server/auth/rbac", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/server/auth/admin-registration-code-service", () => ({
  getAdminRegistrationCodePanel: mocks.getAdminRegistrationCodePanel,
  rotateAdminRegistrationCodes: mocks.rotateAdminRegistrationCodes,
}));

const mockedRequireRole = vi.mocked(requireRole);
const mockedGetAdminRegistrationCodePanel = vi.mocked(
  getAdminRegistrationCodePanel,
);
const mockedRotateAdminRegistrationCodes = vi.mocked(
  rotateAdminRegistrationCodes,
);

const panel = {
  version: 1,
  window: 2939,
  expiresAt: "2026-06-04T00:00:00.000Z",
  generatedAt: "2026-06-01T00:00:00.000Z",
  rotatedAt: "2026-06-01T00:00:00.000Z",
  rotatedByUserId: "admin_1",
  codes: [
    {
      role: UserRole.SUPER_ADMIN,
      label: "Founder / super admin",
      code: "123456",
    },
  ],
};

function jsonRequest(body: unknown): NextRequest {
  return new Request("http://test/api/v1/admin/admin-registration-codes", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  }) as NextRequest;
}

describe("admin registration code API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedRequireRole.mockResolvedValue({
      id: "admin_1",
      email: "owner@example.com",
      name: "Owner",
      role: UserRole.SUPER_ADMIN,
    });
  });

  it("returns active codes only after super-admin authorization", async () => {
    mockedGetAdminRegistrationCodePanel.mockResolvedValueOnce(panel);

    const response = await getRegistrationCodesRoute();
    const body = (await response.json()) as ApiSuccess<{
      registrationCodes: typeof panel;
    }>;

    expect(response.status).toBe(200);
    expect(body.data.registrationCodes.version).toBe(1);
    expect(mockedRequireRole).toHaveBeenCalled();
  });

  it("rotates codes only with explicit confirmation", async () => {
    mockedRotateAdminRegistrationCodes.mockResolvedValueOnce(panel);

    const response = await rotateRegistrationCodesRoute(
      jsonRequest({ confirmation: "ROTATE_ADMIN_REGISTRATION_CODES" }),
    );
    const body = (await response.json()) as ApiSuccess<{
      registrationCodes: typeof panel;
    }>;

    expect(response.status).toBe(200);
    expect(body.data.registrationCodes.codes[0]?.code).toBe("123456");
    expect(mockedRotateAdminRegistrationCodes).toHaveBeenCalledWith(
      expect.objectContaining({ id: "admin_1" }),
    );
  });

  it("rejects rotation without the confirmation literal", async () => {
    const response = await rotateRegistrationCodesRoute(
      jsonRequest({ confirmation: "rotate" }),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedRotateAdminRegistrationCodes).not.toHaveBeenCalled();
  });
});

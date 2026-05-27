import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getAdminHealth } from "@/app/api/v1/admin/health/route";
import { GET as getSuperAdminHealth } from "@/app/api/v1/admin/super-admin/health/route";
import { PATCH as patchPaymentSettings } from "@/app/api/v1/admin/settings/payment/route";
import { requireRole } from "@/server/auth/rbac";
import { UserRole } from "@/server/auth/roles";
import { updatePaymentSettings } from "@/server/modules/payments/payment-service";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

vi.mock("@/server/auth/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/server/modules/payments/payment-service", () => ({
  updatePaymentSettings: vi.fn(),
}));

const mockedRequireRole = vi.mocked(requireRole);
const mockedUpdatePaymentSettings = vi.mocked(updatePaymentSettings);

const paymentSettingsInput = {
  bankName: "Moniepoint",
  accountName: "Sunflour Bakery",
  accountNumber: "1234567890",
  paymentInstruction: "Transfer the exact order total before sending proof.",
  proofWhatsappNumber: "2348012345678",
};

function authError(status: 401 | 403): AppError {
  return new AppError({
    code:
      status === 401 ? ERROR_CODES.UNAUTHORIZED : ERROR_CODES.FORBIDDEN,
    publicMessage:
      status === 401
        ? "Sign in to continue."
        : "You do not have permission to perform this action.",
    status,
  });
}

function requestWithJson(body: unknown): NextRequest {
  return new Request("http://localhost/api/v1/admin/settings/payment", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  }) as NextRequest;
}

describe("admin API RBAC", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects unauthenticated users from admin endpoints", async () => {
    mockedRequireRole.mockRejectedValueOnce(authError(401));

    const response = await getAdminHealth();
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it("rejects customers from admin endpoints", async () => {
    mockedRequireRole.mockRejectedValueOnce(authError(403));

    const response = await getAdminHealth();
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("allows moderators into moderator-safe admin endpoints", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      id: "mod_1",
      email: "manager@example.com",
      name: null,
      image: null,
      role: UserRole.MODERATOR,
    });

    const response = await getAdminHealth();
    const body = (await response.json()) as ApiSuccess<{ role: UserRole }>;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.role).toBe(UserRole.MODERATOR);
  });

  it("rejects moderators from payment settings mutations", async () => {
    mockedRequireRole.mockRejectedValueOnce(authError(403));

    const response = await patchPaymentSettings(
      requestWithJson({ reason: "try restricted update" }),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(mockedUpdatePaymentSettings).not.toHaveBeenCalled();
  });

  it("allows super admins into super admin endpoints", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      id: "super_1",
      email: "owner@example.com",
      name: null,
      image: null,
      role: UserRole.SUPER_ADMIN,
    });

    const response = await getSuperAdminHealth();
    const body = (await response.json()) as ApiSuccess<{ role: UserRole }>;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.role).toBe(UserRole.SUPER_ADMIN);
  });

  it("allows super admins to update payment settings", async () => {
    const timestamp = new Date("2026-01-01T00:00:00.000Z");
    mockedRequireRole.mockResolvedValueOnce({
      id: "super_1",
      email: "owner@example.com",
      name: null,
      image: null,
      role: UserRole.SUPER_ADMIN,
    });
    mockedUpdatePaymentSettings.mockResolvedValueOnce({
      id: "payment_settings_1",
      settingKey: "default",
      ...paymentSettingsInput,
      isActive: true,
      updatedByUserId: "super_1",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const response = await patchPaymentSettings(
      requestWithJson(paymentSettingsInput),
    );
    const body = (await response.json()) as ApiSuccess<{ bankName: string }>;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.bankName).toBe("Moniepoint");
    expect(mockedUpdatePaymentSettings).toHaveBeenCalledWith(
      paymentSettingsInput,
      expect.objectContaining({
        id: "super_1",
        role: UserRole.SUPER_ADMIN,
      }),
    );
  });
});

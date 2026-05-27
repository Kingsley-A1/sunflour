import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OrderStatus,
  PaymentStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { requireRole } from "@/server/auth/rbac";
import {
  getPaymentSettingsForAdmin,
  updateOrderPaymentStatus,
  updatePaymentSettings,
} from "@/server/modules/payments/payment-service";
import { GET as getPaymentSettingsRoute } from "@/app/api/v1/admin/settings/payment/route";
import { PATCH as patchPaymentSettingsRoute } from "@/app/api/v1/admin/settings/payment/route";
import { PATCH as patchPaymentStatusRoute } from "@/app/api/v1/admin/orders/[orderNumber]/payment-status/route";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

vi.mock("@/server/auth/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/server/modules/payments/payment-service", () => ({
  getPaymentSettingsForAdmin: vi.fn(),
  updateOrderPaymentStatus: vi.fn(),
  updatePaymentSettings: vi.fn(),
}));

const mockedRequireRole = vi.mocked(requireRole);
const mockedGetPaymentSettingsForAdmin = vi.mocked(getPaymentSettingsForAdmin);
const mockedUpdatePaymentSettings = vi.mocked(updatePaymentSettings);
const mockedUpdateOrderPaymentStatus = vi.mocked(updateOrderPaymentStatus);

const timestamp = new Date("2026-01-01T00:00:00.000Z");
const superAdmin = {
  id: "super_1",
  email: "owner@example.com",
  name: null,
  image: null,
  role: UserRole.SUPER_ADMIN,
};

const paymentSettingsInput = {
  bankName: "Moniepoint",
  accountName: "Sunflour Bakery",
  accountNumber: "1234567890",
  paymentInstruction: "Transfer the exact order total before sending proof.",
  proofWhatsappNumber: "2348012345678",
};

function jsonRequest(url: string, body: unknown): NextRequest {
  return new Request(url, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  }) as NextRequest;
}

describe("payment API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedRequireRole.mockResolvedValue(superAdmin);
  });

  it("returns payment settings only through the admin settings service", async () => {
    mockedGetPaymentSettingsForAdmin.mockResolvedValueOnce({
      id: "payment_settings_1",
      settingKey: "default",
      ...paymentSettingsInput,
      isActive: true,
      updatedByUserId: "super_1",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const response = await getPaymentSettingsRoute();
    const body = (await response.json()) as ApiSuccess<{
      paymentSettings: { bankName: string } | null;
    }>;

    expect(response.status).toBe(200);
    expect(body.data.paymentSettings?.bankName).toBe("Moniepoint");
  });

  it("lets super admins update payment settings", async () => {
    mockedUpdatePaymentSettings.mockResolvedValueOnce({
      id: "payment_settings_1",
      settingKey: "default",
      ...paymentSettingsInput,
      isActive: true,
      updatedByUserId: "super_1",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const response = await patchPaymentSettingsRoute(
      jsonRequest(
        "http://test/api/v1/admin/settings/payment",
        paymentSettingsInput,
      ),
    );

    expect(response.status).toBe(200);
    expect(mockedUpdatePaymentSettings).toHaveBeenCalledWith(
      paymentSettingsInput,
      superAdmin,
    );
  });

  it("rejects invalid payment settings before service mutation", async () => {
    const response = await patchPaymentSettingsRoute(
      jsonRequest("http://test/api/v1/admin/settings/payment", {
        ...paymentSettingsInput,
        accountNumber: "abc",
      }),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedUpdatePaymentSettings).not.toHaveBeenCalled();
  });

  it("passes admin payment confirmation updates to the payment service", async () => {
    mockedUpdateOrderPaymentStatus.mockResolvedValueOnce({
      order: {
        orderNumber: "SFB-20260101-ABC123",
        status: OrderStatus.PAYMENT_CONFIRMED,
        paymentStatus: PaymentStatus.CONFIRMED,
      },
      event: {
        id: "event_1",
        fromStatus: PaymentStatus.UNPAID,
        toStatus: PaymentStatus.CONFIRMED,
        reason: null,
        createdAt: timestamp,
      },
    });

    const response = await patchPaymentStatusRoute(
      jsonRequest(
        "http://test/api/v1/admin/orders/SFB-20260101-ABC123/payment-status",
        {
          paymentStatus: PaymentStatus.CONFIRMED,
        },
      ),
      {
        params: Promise.resolve({
          orderNumber: "SFB-20260101-ABC123",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateOrderPaymentStatus).toHaveBeenCalledWith(
      "SFB-20260101-ABC123",
      {
        paymentStatus: PaymentStatus.CONFIRMED,
      },
      superAdmin,
    );
  });

  it("requires a reason for rejected payment decisions", async () => {
    const response = await patchPaymentStatusRoute(
      jsonRequest(
        "http://test/api/v1/admin/orders/SFB-20260101-ABC123/payment-status",
        {
          paymentStatus: PaymentStatus.REJECTED,
        },
      ),
      {
        params: Promise.resolve({
          orderNumber: "SFB-20260101-ABC123",
        }),
      },
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedUpdateOrderPaymentStatus).not.toHaveBeenCalled();
  });
});

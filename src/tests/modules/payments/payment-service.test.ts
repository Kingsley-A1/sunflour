import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OrderStatus,
  PaymentStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import {
  buildPaymentSnapshot,
  getActivePaymentSnapshot,
  updateOrderPaymentStatus,
  updatePaymentSettings,
  validatePaymentStatusTransition,
} from "@/server/modules/payments/payment-service";

const mocks = vi.hoisted(() => ({
  paymentSettingFindFirst: vi.fn(),
  paymentSettingFindUnique: vi.fn(),
  paymentSettingUpsert: vi.fn(),
  orderFindUnique: vi.fn(),
  orderUpdate: vi.fn(),
  orderStatusEventCreate: vi.fn(),
  paymentConfirmationEventCreate: vi.fn(),
  transaction: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    paymentSetting: {
      findFirst: mocks.paymentSettingFindFirst,
      findUnique: mocks.paymentSettingFindUnique,
    },
    order: {
      findUnique: mocks.orderFindUnique,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/server/modules/audit/audit-service", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

const mockedWriteAuditLog = vi.mocked(writeAuditLog);
const timestamp = new Date("2026-01-01T00:00:00.000Z");

const superAdmin = {
  id: "super_1",
  email: "owner@example.com",
  name: null,
  image: null,
  role: UserRole.SUPER_ADMIN,
};

const attendant = {
  ...superAdmin,
  id: "attendant_1",
  email: "floor@example.com",
  role: UserRole.ATTENDANT,
};

const paymentSetting = {
  id: "payment_settings_1",
  settingKey: "default",
  bankName: "Moniepoint",
  accountName: "Sunflour Bakery",
  accountNumber: "1234567890",
  paymentInstruction: "Transfer the exact order total before sending proof.",
  proofWhatsappNumber: "2348012345678",
  isActive: true,
  updatedByUserId: "super_1",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const paymentSettingsInput = {
  bankName: paymentSetting.bankName,
  accountName: paymentSetting.accountName,
  accountNumber: paymentSetting.accountNumber,
  paymentInstruction: paymentSetting.paymentInstruction,
  proofWhatsappNumber: paymentSetting.proofWhatsappNumber,
};

describe("payment service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        paymentSetting: {
          upsert: mocks.paymentSettingUpsert,
        },
        order: {
          update: mocks.orderUpdate,
        },
        orderStatusEvent: {
          create: mocks.orderStatusEventCreate,
        },
        paymentConfirmationEvent: {
          create: mocks.paymentConfirmationEventCreate,
        },
        auditLog: {
          create: vi.fn(),
        },
      }),
    );
    mockedWriteAuditLog.mockResolvedValue({ id: "audit_1" });
  });

  it("builds payment account snapshots for orders", () => {
    expect(buildPaymentSnapshot(paymentSetting)).toEqual({
      paymentInstructionSnapshot: [
        "Bank Name: Moniepoint",
        "Account Name: Sunflour Bakery",
        "Account Number: 1234567890",
        "",
        "Transfer the exact order total before sending proof.",
      ].join("\n"),
      proofWhatsappNumberSnapshot: "2348012345678",
    });
  });

  it("returns the active payment snapshot from admin-managed settings", async () => {
    mocks.paymentSettingFindFirst.mockResolvedValueOnce(paymentSetting);

    const snapshot = await getActivePaymentSnapshot();

    expect(snapshot.paymentInstructionSnapshot).toContain("Moniepoint");
    expect(snapshot.proofWhatsappNumberSnapshot).toBe("2348012345678");
  });

  it("fails checkout when no active payment settings exist", async () => {
    mocks.paymentSettingFindFirst.mockResolvedValueOnce(null);

    await expect(getActivePaymentSnapshot()).rejects.toMatchObject({
      code: ERROR_CODES.PAYMENT_SETTINGS_UNAVAILABLE,
      status: 503,
    });
  });

  it("lets super admins update payment settings and writes audit logs", async () => {
    mocks.paymentSettingFindUnique.mockResolvedValueOnce(null);
    mocks.paymentSettingUpsert.mockResolvedValueOnce(paymentSetting);

    const setting = await updatePaymentSettings(
      paymentSettingsInput,
      superAdmin,
    );

    expect(setting.bankName).toBe("Moniepoint");
    expect(mocks.paymentSettingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          updatedByUserId: "super_1",
        }),
      }),
    );
    expect(mockedWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "super_1",
        action: "PAYMENT_SETTINGS_UPDATE",
        targetType: "payment_settings",
      }),
      expect.anything(),
    );
  });

  it("rejects invalid payment status transitions", () => {
    expect(() =>
      validatePaymentStatusTransition(
        PaymentStatus.CONFIRMED,
        PaymentStatus.UNDER_REVIEW,
      ),
    ).toThrow("Payment cannot move from CONFIRMED to UNDER_REVIEW.");
  });

  it("requires a reason when rejecting payment", () => {
    expect(() =>
      validatePaymentStatusTransition(
        PaymentStatus.UNDER_REVIEW,
        PaymentStatus.REJECTED,
      ),
    ).toThrow("Enter the rejection reason.");
  });

  it("prevents attendants from confirming or rejecting payments", async () => {
    await expect(
      updateOrderPaymentStatus(
        "SFB-20260101-ABC123",
        {
          paymentStatus: PaymentStatus.CONFIRMED,
        },
        attendant,
      ),
    ).rejects.toMatchObject({
      status: 403,
      code: ERROR_CODES.FORBIDDEN,
    });
    expect(mocks.orderFindUnique).not.toHaveBeenCalled();
  });

  it("confirms payment manually and records event, order status, and audit log", async () => {
    mocks.orderFindUnique.mockResolvedValueOnce({
      id: "order_1",
      orderNumber: "SFB-20260101-ABC123",
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.UNPAID,
    });
    mocks.orderUpdate.mockResolvedValueOnce({
      orderNumber: "SFB-20260101-ABC123",
      status: OrderStatus.PAYMENT_CONFIRMED,
      paymentStatus: PaymentStatus.CONFIRMED,
    });
    mocks.paymentConfirmationEventCreate.mockResolvedValueOnce({
      id: "event_1",
      fromStatus: PaymentStatus.UNPAID,
      toStatus: PaymentStatus.CONFIRMED,
      reason: null,
      createdAt: timestamp,
    });

    const result = await updateOrderPaymentStatus(
      "SFB-20260101-ABC123",
      {
        paymentStatus: PaymentStatus.CONFIRMED,
      },
      superAdmin,
    );

    expect(result.order.status).toBe(OrderStatus.PAYMENT_CONFIRMED);
    expect(result.event.toStatus).toBe(PaymentStatus.CONFIRMED);
    expect(mocks.orderStatusEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: OrderStatus.PENDING_PAYMENT,
          toStatus: OrderStatus.PAYMENT_CONFIRMED,
        }),
      }),
    );
    expect(mockedWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ORDER_PAYMENT_CONFIRMED",
        metadata: expect.objectContaining({
          fromPaymentStatus: PaymentStatus.UNPAID,
          toPaymentStatus: PaymentStatus.CONFIRMED,
        }),
      }),
      expect.anything(),
    );
  });
});

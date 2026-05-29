import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DeliveryMethod,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import {
  assertOrderCanReceivePaymentStatusUpdate,
  updateAdminOrderStatus,
  validateOrderStatusTransition,
} from "@/server/modules/orders/order-service";

const mocks = vi.hoisted(() => ({
  orderFindUnique: vi.fn(),
  orderUpdate: vi.fn(),
  orderStatusEventCreate: vi.fn(),
  transaction: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
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
const moderator = {
  id: "mod_1",
  email: "manager@example.com",
  name: "Manager",
  image: null,
  role: UserRole.MODERATOR,
};

describe("order service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        order: {
          update: mocks.orderUpdate,
        },
        orderStatusEvent: {
          create: mocks.orderStatusEventCreate,
        },
        auditLog: {
          create: vi.fn(),
        },
      }),
    );
    mockedWriteAuditLog.mockResolvedValue({ id: "audit_1" });
  });

  it("rejects invalid terminal order transitions", () => {
    expect(() =>
      validateOrderStatusTransition(
        OrderStatus.CANCELLED,
        OrderStatus.DELIVERED,
        "override",
      ),
    ).toThrow("Order cannot move from CANCELLED to DELIVERED.");
  });

  it("requires a reason for cancellation", () => {
    try {
      validateOrderStatusTransition(
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
      );
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toMatchObject({
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }
  });

  it("blocks pickup orders from moving out for delivery", () => {
    expect(() =>
      validateOrderStatusTransition(
        OrderStatus.PREPARING,
        OrderStatus.OUT_FOR_DELIVERY,
        undefined,
        DeliveryMethod.PICKUP,
      ),
    ).toThrow("PICKUP orders cannot move to OUT_FOR_DELIVERY.");
  });

  it("blocks delivery orders from moving ready for pickup", () => {
    expect(() =>
      validateOrderStatusTransition(
        OrderStatus.PREPARING,
        OrderStatus.READY_FOR_PICKUP,
        undefined,
        DeliveryMethod.DELIVERY,
      ),
    ).toThrow("DELIVERY orders cannot move to READY_FOR_PICKUP.");
  });

  it("blocks payment updates after order rejection or cancellation", () => {
    try {
      assertOrderCanReceivePaymentStatusUpdate(OrderStatus.REJECTED);
      throw new Error("Expected payment guard to fail.");
    } catch (error) {
      expect(error).toMatchObject({
        code: ERROR_CODES.INVALID_ORDER_STATUS_TRANSITION,
      });
    }
  });

  it("updates status and writes timeline and audit records", async () => {
    mocks.orderFindUnique.mockResolvedValueOnce({
      id: "order_1",
      orderNumber: "SFB-20260101-ABC123",
      status: OrderStatus.PAYMENT_CONFIRMED,
      deliveryMethod: DeliveryMethod.PICKUP,
    });
    mocks.orderUpdate.mockResolvedValueOnce({
      orderNumber: "SFB-20260101-ABC123",
      status: OrderStatus.PREPARING,
      paymentStatus: PaymentStatus.CONFIRMED,
      adminNote: "Start now.",
      cancelledAt: null,
      deliveredAt: null,
    });
    mocks.orderStatusEventCreate.mockResolvedValueOnce({
      id: "event_1",
      fromStatus: OrderStatus.PAYMENT_CONFIRMED,
      toStatus: OrderStatus.PREPARING,
      reason: "Payment verified.",
      createdAt: timestamp,
    });

    const result = await updateAdminOrderStatus(
      "SFB-20260101-ABC123",
      {
        status: OrderStatus.PREPARING,
        reason: "Payment verified.",
        adminNote: "Start now.",
      },
      moderator,
      timestamp,
    );

    expect(result.order.status).toBe(OrderStatus.PREPARING);
    expect(mocks.orderStatusEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: OrderStatus.PAYMENT_CONFIRMED,
          toStatus: OrderStatus.PREPARING,
          changedByUserId: "mod_1",
        }),
      }),
    );
    expect(mockedWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ORDER_STATUS_UPDATE",
        targetType: "order",
      }),
      expect.anything(),
    );
  });
});

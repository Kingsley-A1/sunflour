import type { Prisma } from "@/generated/prisma/client";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import type {
  OrderStatus as OrderStatusValue,
  PaymentStatus as PaymentStatusValue,
} from "@/generated/prisma/enums";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { UserRole } from "@/server/auth/roles";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import { assertOrderCanReceivePaymentStatusUpdate } from "@/server/modules/orders";
import {
  buildPaymentInstructionSnapshot,
  type PaymentInstructionSource,
} from "./payment-instructions";
import type {
  PaymentSettingsUpdateInput,
  PaymentStatusUpdateInput,
} from "./payment-schemas";

const DEFAULT_PAYMENT_SETTING_KEY = "default";

const paymentSettingSelect = {
  id: true,
  settingKey: true,
  bankName: true,
  accountName: true,
  accountNumber: true,
  paymentInstruction: true,
  proofWhatsappNumber: true,
  isActive: true,
  updatedByUserId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PaymentSettingSelect;

type PaymentSettingRecord = Prisma.PaymentSettingGetPayload<{
  select: typeof paymentSettingSelect;
}>;

export interface ActivePaymentSnapshot {
  paymentInstructionSnapshot: string;
  proofWhatsappNumberSnapshot: string;
}

export interface PaymentStatusUpdateResult {
  order: {
    orderNumber: string;
    status: OrderStatusValue;
    paymentStatus: PaymentStatusValue;
  };
  event: {
    id: string;
    fromStatus: PaymentStatusValue;
    toStatus: PaymentStatusValue;
    reason: string | null;
    createdAt: Date;
  };
}

function notFound(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: message,
    status: 404,
  });
}

function unavailablePaymentSettings(): AppError {
  return new AppError({
    code: ERROR_CODES.PAYMENT_SETTINGS_UNAVAILABLE,
    publicMessage: "Payment instructions are not configured yet.",
    status: 503,
  });
}

function invalidPaymentTransition(
  fromStatus: PaymentStatusValue,
  toStatus: PaymentStatusValue,
): AppError {
  return new AppError({
    code: ERROR_CODES.INVALID_PAYMENT_STATUS_TRANSITION,
    publicMessage: `Payment cannot move from ${fromStatus} to ${toStatus}.`,
    status: 400,
  });
}

function missingRejectionReason(): AppError {
  return new AppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    publicMessage: "Enter the rejection reason.",
    status: 400,
    fieldErrors: {
      reason: ["Enter the rejection reason."],
    },
  });
}

function forbiddenPaymentStatusForRole(): AppError {
  return new AppError({
    code: ERROR_CODES.FORBIDDEN,
    publicMessage:
      "Attendants can review payment proof but cannot confirm or reject payments.",
    status: 403,
  });
}

function accountNumberLast4(accountNumber: string): string {
  return accountNumber.slice(-4);
}

function changedPaymentSettingFields(
  before: PaymentSettingRecord | null,
  after: PaymentSettingsUpdateInput,
): string[] {
  if (!before) {
    return Object.keys(after);
  }

  return Object.entries(after)
    .filter(([key, value]) => before[key as keyof PaymentSettingRecord] !== value)
    .map(([key]) => key);
}

export function buildPaymentSnapshot(
  setting: PaymentInstructionSource & { proofWhatsappNumber: string },
): ActivePaymentSnapshot {
  return {
    paymentInstructionSnapshot: buildPaymentInstructionSnapshot(setting),
    proofWhatsappNumberSnapshot: setting.proofWhatsappNumber,
  };
}

export async function getActivePaymentSnapshot(): Promise<ActivePaymentSnapshot> {
  const setting = await prisma.paymentSetting.findFirst({
    where: {
      settingKey: DEFAULT_PAYMENT_SETTING_KEY,
      isActive: true,
    },
    select: paymentSettingSelect,
  });

  if (!setting) {
    throw unavailablePaymentSettings();
  }

  return buildPaymentSnapshot(setting);
}

export async function getPaymentSettingsForAdmin() {
  return prisma.paymentSetting.findUnique({
    where: {
      settingKey: DEFAULT_PAYMENT_SETTING_KEY,
    },
    select: paymentSettingSelect,
  });
}

export async function updatePaymentSettings(
  input: PaymentSettingsUpdateInput,
  actor: AuthenticatedUser,
) {
  const before = await prisma.paymentSetting.findUnique({
    where: {
      settingKey: DEFAULT_PAYMENT_SETTING_KEY,
    },
    select: paymentSettingSelect,
  });
  const changedFields = changedPaymentSettingFields(before, input);

  return prisma.$transaction(async (transaction) => {
    const setting = await transaction.paymentSetting.upsert({
      where: {
        settingKey: DEFAULT_PAYMENT_SETTING_KEY,
      },
      create: {
        settingKey: DEFAULT_PAYMENT_SETTING_KEY,
        bankName: input.bankName,
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        paymentInstruction: input.paymentInstruction,
        proofWhatsappNumber: input.proofWhatsappNumber,
        isActive: input.isActive ?? true,
        updatedByUserId: actor.id,
      },
      update: {
        bankName: input.bankName,
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        paymentInstruction: input.paymentInstruction,
        proofWhatsappNumber: input.proofWhatsappNumber,
        isActive: input.isActive ?? true,
        updatedByUserId: actor.id,
      },
      select: paymentSettingSelect,
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "PAYMENT_SETTINGS_UPDATE",
        targetType: "payment_settings",
        targetId: setting.id,
        metadata: {
          changedFields,
          accountNumberLast4: accountNumberLast4(setting.accountNumber),
          isActive: setting.isActive,
        },
      },
      transaction,
    );

    return setting;
  });
}

const allowedPaymentTransitions: Record<
  PaymentStatusValue,
  readonly PaymentStatusValue[]
> = {
  [PaymentStatus.UNPAID]: [
    PaymentStatus.PROOF_SENT_ON_WHATSAPP,
    PaymentStatus.UNDER_REVIEW,
    PaymentStatus.CONFIRMED,
    PaymentStatus.REJECTED,
  ],
  [PaymentStatus.PROOF_SENT_ON_WHATSAPP]: [
    PaymentStatus.UNDER_REVIEW,
    PaymentStatus.CONFIRMED,
    PaymentStatus.REJECTED,
  ],
  [PaymentStatus.UNDER_REVIEW]: [
    PaymentStatus.CONFIRMED,
    PaymentStatus.REJECTED,
  ],
  [PaymentStatus.CONFIRMED]: [],
  [PaymentStatus.REJECTED]: [],
};

export function validatePaymentStatusTransition(
  fromStatus: PaymentStatusValue,
  toStatus: PaymentStatusValue,
  reason?: string,
): void {
  if (toStatus === PaymentStatus.REJECTED && !reason) {
    throw missingRejectionReason();
  }

  if (!allowedPaymentTransitions[fromStatus].includes(toStatus)) {
    throw invalidPaymentTransition(fromStatus, toStatus);
  }
}

function orderStatusForPaymentStatus(
  paymentStatus: PaymentStatusValue,
): OrderStatusValue {
  if (
    paymentStatus === PaymentStatus.PROOF_SENT_ON_WHATSAPP ||
    paymentStatus === PaymentStatus.UNDER_REVIEW
  ) {
    return OrderStatus.PAYMENT_UNDER_REVIEW;
  }

  if (paymentStatus === PaymentStatus.CONFIRMED) {
    return OrderStatus.PAYMENT_CONFIRMED;
  }

  if (paymentStatus === PaymentStatus.REJECTED) {
    return OrderStatus.REJECTED;
  }

  return OrderStatus.PENDING_PAYMENT;
}

function auditActionForPaymentStatus(
  paymentStatus: PaymentStatusValue,
): string {
  if (paymentStatus === PaymentStatus.CONFIRMED) {
    return "ORDER_PAYMENT_CONFIRMED";
  }

  if (paymentStatus === PaymentStatus.REJECTED) {
    return "ORDER_PAYMENT_REJECTED";
  }

  return "ORDER_PAYMENT_STATUS_UPDATE";
}

export interface CustomerProofHandoffResult {
  orderNumber: string;
  status: OrderStatusValue;
  paymentStatus: PaymentStatusValue;
  alreadyRecorded: boolean;
}

/**
 * Records that a customer handed off payment proof on WhatsApp. This is a
 * customer-triggered, token-protected action: it only moves an UNPAID order to
 * PROOF_SENT_ON_WHATSAPP (and the order to PAYMENT_UNDER_REVIEW). It never
 * confirms payment — manual confirmation stays an admin action. The call is
 * idempotent: once proof is recorded (or payment progressed), it is a no-op.
 */
export async function recordCustomerProofSent(
  orderNumber: string,
  token: string,
): Promise<CustomerProofHandoffResult> {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      invoice: {
        publicAccessToken: token,
      },
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    throw notFound("Order not found for the provided proof link.");
  }

  if (order.paymentStatus !== PaymentStatus.UNPAID) {
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      alreadyRecorded: true,
    };
  }

  assertOrderCanReceivePaymentStatusUpdate(order.status);

  const nextPaymentStatus = PaymentStatus.PROOF_SENT_ON_WHATSAPP;
  const nextOrderStatus = orderStatusForPaymentStatus(nextPaymentStatus);
  const reason = "Customer reported payment proof sent on WhatsApp.";

  return prisma.$transaction(async (transaction) => {
    const updatedOrder = await transaction.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: nextPaymentStatus,
        status: nextOrderStatus,
      },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (order.status !== nextOrderStatus) {
      await transaction.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: nextOrderStatus,
          reason,
        },
      });
    }

    await transaction.paymentConfirmationEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.paymentStatus,
        toStatus: nextPaymentStatus,
        reason,
      },
    });

    await writeAuditLog(
      {
        action: "ORDER_PROOF_SENT_BY_CUSTOMER",
        targetType: "order",
        targetId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          fromPaymentStatus: order.paymentStatus,
          toPaymentStatus: nextPaymentStatus,
          fromOrderStatus: order.status,
          toOrderStatus: nextOrderStatus,
        },
      },
      transaction,
    );

    return {
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      alreadyRecorded: false,
    };
  });
}

export async function updateOrderPaymentStatus(
  orderNumber: string,
  input: PaymentStatusUpdateInput,
  actor: AuthenticatedUser,
): Promise<PaymentStatusUpdateResult> {
  if (
    actor.role === UserRole.ATTENDANT &&
    input.paymentStatus !== PaymentStatus.PROOF_SENT_ON_WHATSAPP &&
    input.paymentStatus !== PaymentStatus.UNDER_REVIEW
  ) {
    throw forbiddenPaymentStatusForRole();
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    throw notFound("Order not found.");
  }

  assertOrderCanReceivePaymentStatusUpdate(order.status);

  validatePaymentStatusTransition(
    order.paymentStatus,
    input.paymentStatus,
    input.reason,
  );

  const nextOrderStatus = orderStatusForPaymentStatus(input.paymentStatus);

  return prisma.$transaction(async (transaction) => {
    const updatedOrder = await transaction.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: input.paymentStatus,
        status: nextOrderStatus,
      },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (order.status !== nextOrderStatus) {
      await transaction.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: nextOrderStatus,
          changedByUserId: actor.id,
          reason: input.reason ?? "Payment status updated.",
        },
      });
    }

    const event = await transaction.paymentConfirmationEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.paymentStatus,
        toStatus: input.paymentStatus,
        changedByUserId: actor.id,
        reason: input.reason,
      },
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        reason: true,
        createdAt: true,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: auditActionForPaymentStatus(input.paymentStatus),
        targetType: "order",
        targetId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          fromPaymentStatus: order.paymentStatus,
          toPaymentStatus: input.paymentStatus,
          fromOrderStatus: order.status,
          toOrderStatus: nextOrderStatus,
          reason: input.reason ?? null,
        },
      },
      transaction,
    );

    return {
      order: updatedOrder,
      event,
    };
  });
}

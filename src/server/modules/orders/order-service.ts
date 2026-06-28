import type { Prisma } from "@/generated/prisma/client";
import { DeliveryMethod, OrderStatus, UserRole } from "@/generated/prisma/enums";
import type {
  DeliveryMethod as DeliveryMethodValue,
  OrderStatus as OrderStatusValue,
} from "@/generated/prisma/enums";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import { queueOrderStatusUpdateEmailForOrder } from "@/server/modules/email";
import type {
  AdminOrderListQueryInput,
  OrderAdminNoteUpdateInput,
  OrderStatusUpdateInput,
} from "./order-schemas";

const terminalOrderStatuses = [
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
  OrderStatus.DELIVERED,
] as const;

const allowedOrderTransitions: Record<
  OrderStatusValue,
  readonly OrderStatusValue[]
> = {
  [OrderStatus.PENDING_PAYMENT]: [
    OrderStatus.PAYMENT_UNDER_REVIEW,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
  ],
  [OrderStatus.PAYMENT_UNDER_REVIEW]: [
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
  ],
  [OrderStatus.PAYMENT_CONFIRMED]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.READY_FOR_PICKUP]: [
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.OUT_FOR_DELIVERY]: [
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED]: [],
};

const adminOrderListSelect = {
  orderNumber: true,
  customerType: true,
  customerNameSnapshot: true,
  customerPhoneSnapshot: true,
  deliveryMethod: true,
  deliveryZoneNameSnapshot: true,
  subtotal: true,
  total: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  createdAt: true,
  updatedAt: true,
  cancelledAt: true,
  deliveredAt: true,
  _count: {
    select: {
      items: true,
    },
  },
} satisfies Prisma.OrderSelect;

const adminOrderDetailSelect = {
  ...adminOrderListSelect,
  customerEmailSnapshot: true,
  deliveryAddressSnapshot: true,
  deliveryBaseFeeSnapshot: true,
  deliverySurchargeSnapshot: true,
  deliveryTotalFeeSnapshot: true,
  paymentInstructionSnapshot: true,
  proofWhatsappNumberSnapshot: true,
  customerNote: true,
  adminNote: true,
  items: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      productNameSnapshot: true,
      variantNameSnapshot: true,
      unitPriceSnapshot: true,
      quantity: true,
      lineTotal: true,
    },
  },
  invoice: {
    select: {
      invoiceNumber: true,
      pdfUrl: true,
      generatedAt: true,
      createdAt: true,
    },
  },
  statusEvents: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      reason: true,
      createdAt: true,
      changedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  },
  paymentConfirmationEvents: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      reason: true,
      createdAt: true,
      changedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

type AdminOrderListRecord = Prisma.OrderGetPayload<{
  select: typeof adminOrderListSelect;
}>;

type AdminOrderDetailRecord = Prisma.OrderGetPayload<{
  select: typeof adminOrderDetailSelect;
}>;

function notFound(): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: "Order not found.",
    status: 404,
  });
}

function missingReason(): AppError {
  return new AppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    publicMessage: "Enter the reason for this protected status change.",
    status: 400,
    fieldErrors: {
      reason: ["Enter the reason for this protected status change."],
    },
  });
}

function invalidOrderTransition(
  fromStatus: OrderStatusValue,
  toStatus: OrderStatusValue,
): AppError {
  return new AppError({
    code: ERROR_CODES.INVALID_ORDER_STATUS_TRANSITION,
    publicMessage: `Order cannot move from ${fromStatus} to ${toStatus}.`,
    status: 400,
  });
}

function invalidFulfillmentTransition(
  deliveryMethod: DeliveryMethodValue,
  toStatus: OrderStatusValue,
): AppError {
  return new AppError({
    code: ERROR_CODES.INVALID_ORDER_STATUS_TRANSITION,
    publicMessage: `${deliveryMethod} orders cannot move to ${toStatus}.`,
    status: 400,
  });
}

function forbiddenOrderStatusForRole(): AppError {
  return new AppError({
    code: ERROR_CODES.FORBIDDEN,
    publicMessage:
      "Attendants cannot mark payment as confirmed through order status updates.",
    status: 403,
  });
}

function isTerminalOrderStatus(status: OrderStatusValue): boolean {
  return terminalOrderStatuses.includes(
    status as (typeof terminalOrderStatuses)[number],
  );
}

function normalizePhoneSearch(phone: string): string {
  return phone.replace(/\D/g, "");
}

function buildOrderListWhere(
  input: AdminOrderListQueryInput,
): Prisma.OrderWhereInput {
  return {
    status: input.status,
    paymentStatus: input.paymentStatus,
    customerType: input.customerType,
    orderNumber: input.orderNumber
      ? { contains: input.orderNumber }
      : undefined,
    customerPhoneSnapshot: input.customerPhone
      ? { contains: normalizePhoneSearch(input.customerPhone) }
      : undefined,
    createdAt:
      input.createdFrom || input.createdTo
        ? {
            gte: input.createdFrom,
            lte: input.createdTo,
          }
        : undefined,
  };
}

function auditActionForOrderStatus(status: OrderStatusValue): string {
  if (status === OrderStatus.CANCELLED) {
    return "ORDER_CANCELLED";
  }

  if (status === OrderStatus.REJECTED) {
    return "ORDER_REJECTED";
  }

  if (status === OrderStatus.DELIVERED) {
    return "ORDER_DELIVERED";
  }

  return "ORDER_STATUS_UPDATE";
}

export function assertOrderCanReceivePaymentStatusUpdate(
  orderStatus: OrderStatusValue,
): void {
  if (orderStatus === OrderStatus.CANCELLED || orderStatus === OrderStatus.REJECTED) {
    throw new AppError({
      code: ERROR_CODES.INVALID_ORDER_STATUS_TRANSITION,
      publicMessage:
        "Payment status cannot be changed after an order is closed.",
      status: 400,
    });
  }
}

export function validateOrderStatusTransition(
  fromStatus: OrderStatusValue,
  toStatus: OrderStatusValue,
  reason?: string,
  deliveryMethod?: DeliveryMethodValue,
): void {
  if (
    (toStatus === OrderStatus.CANCELLED ||
      toStatus === OrderStatus.REJECTED) &&
    !reason
  ) {
    throw missingReason();
  }

  if (
    fromStatus === toStatus ||
    isTerminalOrderStatus(fromStatus) ||
    !allowedOrderTransitions[fromStatus].includes(toStatus)
  ) {
    throw invalidOrderTransition(fromStatus, toStatus);
  }

  if (
    deliveryMethod === DeliveryMethod.PICKUP &&
    toStatus === OrderStatus.OUT_FOR_DELIVERY
  ) {
    throw invalidFulfillmentTransition(deliveryMethod, toStatus);
  }

  if (
    deliveryMethod === DeliveryMethod.DELIVERY &&
    toStatus === OrderStatus.READY_FOR_PICKUP
  ) {
    throw invalidFulfillmentTransition(deliveryMethod, toStatus);
  }
}

export async function listAdminOrders(input: AdminOrderListQueryInput) {
  const where = buildOrderListWhere(input);
  const skip = (input.page - 1) * input.pageSize;
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: input.pageSize,
      select: adminOrderListSelect,
    }),
  ]);

  return {
    orders,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      pageCount: Math.ceil(total / input.pageSize),
    },
  };
}

export async function getAdminOrderDetail(
  orderNumber: string,
): Promise<AdminOrderDetailRecord> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: adminOrderDetailSelect,
  });

  if (!order) {
    throw notFound();
  }

  return order;
}

export async function updateAdminOrderStatus(
  orderNumber: string,
  input: OrderStatusUpdateInput,
  actor: AuthenticatedUser,
  now = new Date(),
) {
  if (
    actor.role === UserRole.ATTENDANT &&
    input.status === OrderStatus.PAYMENT_CONFIRMED
  ) {
    throw forbiddenOrderStatusForRole();
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      deliveryMethod: true,
      customerNameSnapshot: true,
      customerEmailSnapshot: true,
    },
  });

  if (!order) {
    throw notFound();
  }

  validateOrderStatusTransition(
    order.status,
    input.status,
    input.reason,
    order.deliveryMethod,
  );

  const result = await prisma.$transaction(async (transaction) => {
    const updatedOrder = await transaction.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        adminNote: input.adminNote,
        cancelledAt: input.status === OrderStatus.CANCELLED ? now : undefined,
        deliveredAt: input.status === OrderStatus.DELIVERED ? now : undefined,
      },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
        adminNote: true,
        cancelledAt: true,
        deliveredAt: true,
      },
    });

    const event = await transaction.orderStatusEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: input.status,
        changedByUserId: actor.id,
        reason: input.reason ?? "Order status updated by admin.",
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
        action: auditActionForOrderStatus(input.status),
        targetType: "order",
        targetId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          fromStatus: order.status,
          toStatus: input.status,
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

  // Best-effort customer notification. Email must never break the status update.
  try {
    await queueOrderStatusUpdateEmailForOrder(
      {
        orderNumber: order.orderNumber,
        customerNameSnapshot: order.customerNameSnapshot,
        customerEmailSnapshot: order.customerEmailSnapshot,
      },
      input.status,
    );
  } catch {
    // Outbox issues must not block the order lifecycle.
  }

  return result;
}

export async function updateAdminOrderNote(
  orderNumber: string,
  input: OrderAdminNoteUpdateInput,
  actor: AuthenticatedUser,
) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      adminNote: true,
    },
  });

  if (!order) {
    throw notFound();
  }

  return prisma.$transaction(async (transaction) => {
    const updatedOrder = await transaction.order.update({
      where: { id: order.id },
      data: {
        adminNote: input.adminNote,
      },
      select: {
        orderNumber: true,
        adminNote: true,
        updatedAt: true,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "ORDER_ADMIN_NOTE_UPDATE",
        targetType: "order",
        targetId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          hadPreviousNote: Boolean(order.adminNote),
        },
      },
      transaction,
    );

    return updatedOrder;
  });
}

export type { AdminOrderDetailRecord, AdminOrderListRecord };

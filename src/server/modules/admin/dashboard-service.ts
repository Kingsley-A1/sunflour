import type { Prisma } from "@/generated/prisma/client";
import {
  CustomerType,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  ReviewStatus,
} from "@/generated/prisma/enums";
import { getServerEnv } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { getLocalDayUtcRange } from "@/server/lib/date-time";
import type { DashboardMetricsQueryInput } from "./dashboard-schemas";

export interface DashboardMetricsDateRange {
  from: Date;
  to: Date;
  timeZone: string;
}

function resolveDateRange(
  input: DashboardMetricsQueryInput,
  now: Date,
): DashboardMetricsDateRange {
  const timeZone = getServerEnv().APP_TIME_ZONE;

  if (input.from || input.to) {
    const today = getLocalDayUtcRange(now, timeZone);

    return {
      from: input.from ?? today.start,
      to: input.to ?? now,
      timeZone,
    };
  }

  const today = getLocalDayUtcRange(now, timeZone);

  return {
    from: today.start,
    to: today.end,
    timeZone,
  };
}

function createdAtRange(range: DashboardMetricsDateRange) {
  return {
    gte: range.from,
    lt: range.to,
  };
}

function activeSalesWhere(range: DashboardMetricsDateRange): Prisma.OrderWhereInput {
  return {
    createdAt: createdAtRange(range),
    paymentStatus: PaymentStatus.CONFIRMED,
    status: {
      notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED],
    },
  };
}

export async function getDashboardMetrics(
  input: DashboardMetricsQueryInput,
  now = new Date(),
) {
  const range = resolveDateRange(input, now);
  const rangeWhere = {
    createdAt: createdAtRange(range),
  } satisfies Prisma.OrderWhereInput;

  const [
    ordersInRange,
    pendingPaymentConfirmation,
    preparingOrders,
    totalUsers,
    guestOrdersInRange,
    cancelledOrders,
    outForDeliveryOrders,
    deliveredOrders,
    salesEstimate,
    topOrderedItems,
    unavailableProducts,
    pendingReviews,
    recentPendingReviews,
  ] = await Promise.all([
    prisma.order.count({ where: rangeWhere }),
    prisma.order.count({
      where: {
        paymentStatus: {
          in: [
            PaymentStatus.PROOF_SENT_ON_WHATSAPP,
            PaymentStatus.UNDER_REVIEW,
          ],
        },
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED],
        },
      },
    }),
    prisma.order.count({ where: { status: OrderStatus.PREPARING } }),
    prisma.user.count(),
    prisma.order.count({
      where: {
        ...rangeWhere,
        customerType: CustomerType.GUEST,
      },
    }),
    prisma.order.count({
      where: {
        ...rangeWhere,
        status: OrderStatus.CANCELLED,
      },
    }),
    prisma.order.count({ where: { status: OrderStatus.OUT_FOR_DELIVERY } }),
    prisma.order.count({
      where: {
        ...rangeWhere,
        status: OrderStatus.DELIVERED,
      },
    }),
    prisma.order.aggregate({
      where: activeSalesWhere(range),
      _sum: {
        total: true,
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productNameSnapshot", "variantNameSnapshot"],
      where: {
        order: activeSalesWhere(range),
      },
      _sum: {
        quantity: true,
        lineTotal: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    }),
    prisma.product.findMany({
      where: {
        status: {
          in: [ProductStatus.HIDDEN, ProductStatus.OUT_OF_STOCK],
        },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        basePrice: true,
      },
    }),
    prisma.review.count({
      where: {
        status: ReviewStatus.PENDING,
      },
    }),
    prisma.review.findMany({
      where: {
        status: ReviewStatus.PENDING,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        customerNameSnapshot: true,
        rating: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  return {
    range,
    counts: {
      ordersInRange,
      pendingPaymentConfirmation,
      preparingOrders,
      totalUsers,
      guestOrdersInRange,
      cancelledOrders,
      outForDeliveryOrders,
      deliveredOrders,
      pendingReviews,
    },
    salesEstimate: {
      label: "Confirmed sales estimate",
      currency: "NGN",
      total: salesEstimate._sum.total ?? 0,
    },
    topOrderedItems: topOrderedItems.map((item) => ({
      productName: item.productNameSnapshot,
      variantName: item.variantNameSnapshot,
      quantity: item._sum.quantity ?? 0,
      salesTotal: item._sum.lineTotal ?? 0,
    })),
    unavailableProducts,
    recentPendingReviews,
  };
}

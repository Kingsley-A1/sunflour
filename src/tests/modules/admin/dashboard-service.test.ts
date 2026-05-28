import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CustomerType,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  ReviewStatus,
} from "@/generated/prisma/enums";
import { getDashboardMetrics } from "@/server/modules/admin/dashboard-service";

const mocks = vi.hoisted(() => ({
  orderCount: vi.fn(),
  orderAggregate: vi.fn(),
  userCount: vi.fn(),
  orderItemGroupBy: vi.fn(),
  productFindMany: vi.fn(),
  reviewCount: vi.fn(),
  reviewFindMany: vi.fn(),
}));

vi.mock("@/server/config/env", () => ({
  getServerEnv: () => ({
    APP_TIME_ZONE: "Africa/Lagos",
  }),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    order: {
      count: mocks.orderCount,
      aggregate: mocks.orderAggregate,
    },
    user: {
      count: mocks.userCount,
    },
    orderItem: {
      groupBy: mocks.orderItemGroupBy,
    },
    product: {
      findMany: mocks.productFindMany,
    },
    review: {
      count: mocks.reviewCount,
      findMany: mocks.reviewFindMany,
    },
  },
}));

describe("dashboard service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.orderCount
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    mocks.userCount.mockResolvedValueOnce(12);
    mocks.orderAggregate.mockResolvedValueOnce({
      _sum: {
        total: 900_000,
      },
    });
    mocks.orderItemGroupBy.mockResolvedValueOnce([
      {
        productNameSnapshot: "Meat Pie",
        variantNameSnapshot: null,
        _sum: {
          quantity: 6,
          lineTotal: 600_000,
        },
      },
    ]);
    mocks.productFindMany.mockResolvedValueOnce([
      {
        id: "product_1",
        name: "Cake",
        slug: "cake",
        status: ProductStatus.OUT_OF_STOCK,
        basePrice: 500_000,
      },
    ]);
    mocks.reviewCount.mockResolvedValueOnce(5);
    mocks.reviewFindMany.mockResolvedValueOnce([]);
  });

  it("returns operational metrics without sensitive settings", async () => {
    const metrics = await getDashboardMetrics(
      {
        from: new Date("2026-01-01T00:00:00.000Z"),
        to: new Date("2026-01-02T00:00:00.000Z"),
      },
      new Date("2026-01-01T12:00:00.000Z"),
    );

    expect(metrics.counts.ordersInRange).toBe(4);
    expect(metrics.counts.pendingPaymentConfirmation).toBe(2);
    expect(metrics.salesEstimate.total).toBe(900_000);
    expect(metrics.topOrderedItems[0]).toEqual({
      productName: "Meat Pie",
      variantName: null,
      quantity: 6,
      salesTotal: 600_000,
    });
    expect(metrics).not.toHaveProperty("paymentSettings");
    expect(mocks.orderAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          paymentStatus: PaymentStatus.CONFIRMED,
          status: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED],
          },
        }),
      }),
    );
    expect(mocks.orderCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          customerType: CustomerType.GUEST,
        }),
      }),
    );
    expect(mocks.reviewCount).toHaveBeenCalledWith({
      where: {
        status: ReviewStatus.PENDING,
      },
    });
  });
});

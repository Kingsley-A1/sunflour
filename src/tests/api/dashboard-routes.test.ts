import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/server/auth/rbac";
import { getDashboardMetrics } from "@/server/modules/admin";
import { GET as getDashboardRoute } from "@/app/api/v1/admin/dashboard/route";
import type { ApiSuccess } from "@/server/lib/api/response";

vi.mock("@/server/auth/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/server/modules/admin", () => ({
  dashboardMetricsQuerySchema: {
    safeParse: vi.fn((input) => ({
      success: true,
      data: input,
    })),
  },
  getDashboardMetrics: vi.fn(),
}));

const mockedRequireRole = vi.mocked(requireRole);
const mockedGetDashboardMetrics = vi.mocked(getDashboardMetrics);
const moderator = {
  id: "mod_1",
  email: "manager@example.com",
  name: "Manager",
  image: null,
  role: UserRole.MODERATOR,
};

describe("dashboard API route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedRequireRole.mockResolvedValue(moderator);
    mockedGetDashboardMetrics.mockResolvedValue({
      range: {
        from: new Date("2026-01-01T00:00:00.000Z"),
        to: new Date("2026-01-02T00:00:00.000Z"),
        timeZone: "Africa/Lagos",
      },
      counts: {
        ordersInRange: 1,
        pendingPaymentConfirmation: 0,
        preparingOrders: 0,
        totalUsers: 2,
        guestOrdersInRange: 1,
        cancelledOrders: 0,
        outForDeliveryOrders: 0,
        deliveredOrders: 0,
        pendingReviews: 0,
        totalProducts: 0,
        draftProducts: 0,
      },
      salesEstimate: {
        label: "Confirmed sales estimate",
        currency: "NGN",
        total: 0,
        semantics: "range",
      },
      rangeMetrics: {
        ordersInRange: 1,
        guestOrdersInRange: 1,
        cancelledOrders: 0,
        deliveredOrders: 0,
        salesEstimate: {
          label: "Confirmed sales estimate",
          currency: "NGN",
          total: 0,
          semantics: "range",
        },
        topOrderedItems: [],
      },
      currentBacklog: {
        pendingPaymentConfirmation: 0,
        preparingOrders: 0,
        totalUsers: 2,
        outForDeliveryOrders: 0,
        pendingReviews: 0,
        unavailableProducts: [],
        recentPendingReviews: [],
      },
      topOrderedItems: [],
      unavailableProducts: [],
      recentPendingReviews: [],
    });
  });

  it("requires admin role and returns dashboard metrics", async () => {
    const response = await getDashboardRoute(
      new Request("http://test/api/v1/admin/dashboard"),
    );
    const body = (await response.json()) as ApiSuccess<{
      counts: {
        ordersInRange: number;
      };
    }>;

    expect(response.status).toBe(200);
    expect(mockedRequireRole).toHaveBeenCalled();
    expect(body.data.counts.ordersInRange).toBe(1);
  });
});

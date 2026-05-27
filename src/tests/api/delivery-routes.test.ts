import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeliveryMethod, UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/server/auth/rbac";
import {
  createDeliveryZone,
  getDeliveryQuote,
  listPublicDeliveryZones,
  updateSurchargeRule,
} from "@/server/modules/delivery/delivery-service";
import { GET as getDeliveryZonesRoute } from "@/app/api/v1/public/delivery/zones/route";
import { POST as postDeliveryQuoteRoute } from "@/app/api/v1/public/delivery/quote/route";
import { POST as postAdminDeliveryZoneRoute } from "@/app/api/v1/admin/delivery/zones/route";
import { PATCH as patchSurchargeRuleRoute } from "@/app/api/v1/admin/delivery/surcharge-rules/[id]/route";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

vi.mock("@/server/auth/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/server/modules/delivery/delivery-service", () => ({
  createDeliveryZone: vi.fn(),
  getDeliveryQuote: vi.fn(),
  listPublicDeliveryZones: vi.fn(),
  updateSurchargeRule: vi.fn(),
}));

const mockedRequireRole = vi.mocked(requireRole);
const mockedCreateDeliveryZone = vi.mocked(createDeliveryZone);
const mockedGetDeliveryQuote = vi.mocked(getDeliveryQuote);
const mockedListPublicDeliveryZones = vi.mocked(listPublicDeliveryZones);
const mockedUpdateSurchargeRule = vi.mocked(updateSurchargeRule);

const superAdmin = {
  id: "admin_1",
  email: "owner@example.com",
  name: null,
  image: null,
  role: UserRole.SUPER_ADMIN,
};

function jsonRequest(url: string, body: unknown): NextRequest {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  }) as NextRequest;
}

describe("delivery API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedRequireRole.mockResolvedValue(superAdmin);
  });

  it("returns active public delivery zones with server base fees", async () => {
    mockedListPublicDeliveryZones.mockResolvedValueOnce({
      zones: [
        {
          id: "zone_1",
          name: "Central Bakery Area",
          slug: "central-bakery-area",
          baseFee: 150_000,
        },
      ],
    });

    const response = await getDeliveryZonesRoute();
    const body = (await response.json()) as ApiSuccess<{
      zones: Array<{ baseFee: number }>;
    }>;

    expect(response.status).toBe(200);
    expect(body.data.zones[0]?.baseFee).toBe(150_000);
  });

  it("calculates delivery quote server-side", async () => {
    mockedGetDeliveryQuote.mockResolvedValueOnce({
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryZone: {
        id: "zone_1",
        name: "Central Bakery Area",
        slug: "central-bakery-area",
      },
      baseFee: 150_000,
      surcharge: 50_000,
      totalFee: 200_000,
      appliedSurchargeRules: [],
      quotedAt: "2026-01-01T17:00:00.000Z",
    });

    const response = await postDeliveryQuoteRoute(
      jsonRequest("http://test/api/v1/public/delivery/quote", {
        deliveryMethod: DeliveryMethod.DELIVERY,
        deliveryZoneId: "zone_1",
      }),
    );
    const body = (await response.json()) as ApiSuccess<{ totalFee: number }>;

    expect(response.status).toBe(200);
    expect(body.data.totalFee).toBe(200_000);
    expect(mockedGetDeliveryQuote).toHaveBeenCalledWith({
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryZoneId: "zone_1",
    });
  });

  it("rejects client-submitted delivery totals", async () => {
    const response = await postDeliveryQuoteRoute(
      jsonRequest("http://test/api/v1/public/delivery/quote", {
        deliveryMethod: DeliveryMethod.DELIVERY,
        deliveryZoneId: "zone_1",
        totalFee: 1,
      }),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedGetDeliveryQuote).not.toHaveBeenCalled();
  });

  it("lets super admins create delivery zones", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    mockedCreateDeliveryZone.mockResolvedValueOnce({
      id: "zone_1",
      name: "Central Bakery Area",
      slug: "central-bakery-area",
      baseFee: 150_000,
      isActive: true,
      sortOrder: 0,
      createdAt,
      updatedAt: createdAt,
    });

    const response = await postAdminDeliveryZoneRoute(
      jsonRequest("http://test/api/v1/admin/delivery/zones", {
        name: "Central Bakery Area",
        baseFee: 150_000,
      }),
    );

    expect(response.status).toBe(201);
    expect(mockedCreateDeliveryZone).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Central Bakery Area",
        baseFee: 150_000,
      }),
      superAdmin,
    );
  });

  it("lets super admins update surcharge rules", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    mockedUpdateSurchargeRule.mockResolvedValueOnce({
      id: "rule_1",
      name: "6 PM delivery surcharge",
      startsAtTime: "18:00",
      endsAtTime: null,
      amount: 50_000,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    });

    const response = await patchSurchargeRuleRoute(
      jsonRequest(
        "http://test/api/v1/admin/delivery/surcharge-rules/rule_1",
        {
          amount: 50_000,
          isActive: true,
        },
      ),
      {
        params: Promise.resolve({ id: "rule_1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateSurchargeRule).toHaveBeenCalledWith(
      "rule_1",
      expect.objectContaining({
        amount: 50_000,
        isActive: true,
      }),
      superAdmin,
    );
  });
});

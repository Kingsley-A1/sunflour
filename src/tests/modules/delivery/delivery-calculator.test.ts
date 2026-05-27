import { describe, expect, it } from "vitest";
import { DeliveryMethod } from "@/generated/prisma/enums";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { AppError } from "@/server/lib/errors/app-error";
import { calculateDeliveryQuote } from "@/server/modules/delivery/delivery-calculator";
import { buildDeliveryFeeSnapshot } from "@/server/modules/delivery/delivery-snapshot";

const activeZone = {
  id: "zone_1",
  name: "Central Bakery Area",
  slug: "central-bakery-area",
  baseFee: 150_000,
  isActive: true,
};

const inactiveZone = {
  ...activeZone,
  id: "zone_inactive",
  isActive: false,
};

const sixPmRule = {
  id: "rule_1",
  name: "6 PM delivery surcharge",
  startsAtTime: "18:00",
  endsAtTime: null,
  amount: 50_000,
  isActive: true,
};

describe("delivery fee calculator", () => {
  it("returns the delivery zone base fee before 6 PM", () => {
    const quote = calculateDeliveryQuote({
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryZone: activeZone,
      surchargeRules: [sixPmRule],
      quotedAt: new Date("2026-01-01T16:59:00.000Z"),
    });

    expect(quote.baseFee).toBe(150_000);
    expect(quote.surcharge).toBe(0);
    expect(quote.totalFee).toBe(150_000);
  });

  it("applies the 6 PM surcharge at exactly 6 PM", () => {
    const quote = calculateDeliveryQuote({
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryZone: activeZone,
      surchargeRules: [sixPmRule],
      quotedAt: new Date("2026-01-01T17:00:00.000Z"),
    });

    expect(quote.surcharge).toBe(50_000);
    expect(quote.totalFee).toBe(200_000);
  });

  it("applies the surcharge after 6 PM", () => {
    const quote = calculateDeliveryQuote({
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryZone: activeZone,
      surchargeRules: [sixPmRule],
      quotedAt: new Date("2026-01-01T18:30:00.000Z"),
    });

    expect(quote.surcharge).toBe(50_000);
    expect(quote.totalFee).toBe(200_000);
  });

  it("keeps pickup at zero fee and ignores surcharge rules", () => {
    const quote = calculateDeliveryQuote({
      deliveryMethod: DeliveryMethod.PICKUP,
      deliveryZone: activeZone,
      surchargeRules: [sixPmRule],
      quotedAt: new Date("2026-01-01T18:30:00.000Z"),
    });

    expect(quote.deliveryZone).toBeNull();
    expect(quote.baseFee).toBe(0);
    expect(quote.surcharge).toBe(0);
    expect(quote.totalFee).toBe(0);
  });

  it("rejects inactive delivery zones", () => {
    expect(() =>
      calculateDeliveryQuote({
        deliveryMethod: DeliveryMethod.DELIVERY,
        deliveryZone: inactiveZone,
        surchargeRules: [sixPmRule],
      }),
    ).toThrow(AppError);

    try {
      calculateDeliveryQuote({
        deliveryMethod: DeliveryMethod.DELIVERY,
        deliveryZone: inactiveZone,
        surchargeRules: [sixPmRule],
      });
    } catch (error) {
      expect(error).toMatchObject({
        code: ERROR_CODES.DELIVERY_ZONE_UNAVAILABLE,
        status: 400,
      });
    }
  });

  it("builds the order delivery fee snapshot from a server quote", () => {
    const quote = calculateDeliveryQuote({
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryZone: activeZone,
      surchargeRules: [sixPmRule],
      quotedAt: new Date("2026-01-01T17:00:00.000Z"),
    });

    expect(buildDeliveryFeeSnapshot(quote)).toEqual({
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryZoneIdSnapshot: "zone_1",
      deliveryZoneNameSnapshot: "Central Bakery Area",
      deliveryBaseFeeSnapshot: 150_000,
      deliverySurchargeSnapshot: 50_000,
      deliveryTotalFeeSnapshot: 200_000,
    });
  });
});

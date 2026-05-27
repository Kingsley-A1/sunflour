import { describe, expect, it } from "vitest";
import { shouldApplyDeliverySurcharge } from "@/server/lib/date-time/delivery-surcharge";

describe("delivery surcharge utility", () => {
  it("does not apply before 6 PM in the configured timezone", () => {
    const orderedAt = new Date("2026-01-01T16:59:00.000Z");

    expect(
      shouldApplyDeliverySurcharge({
        deliveryMethod: "DELIVERY",
        orderedAt,
      }),
    ).toBe(false);
  });

  it("applies at exactly 6 PM in the configured timezone", () => {
    const orderedAt = new Date("2026-01-01T17:00:00.000Z");

    expect(
      shouldApplyDeliverySurcharge({
        deliveryMethod: "DELIVERY",
        orderedAt,
      }),
    ).toBe(true);
  });

  it("does not apply to pickup orders", () => {
    const orderedAt = new Date("2026-01-01T18:00:00.000Z");

    expect(
      shouldApplyDeliverySurcharge({
        deliveryMethod: "PICKUP",
        orderedAt,
      }),
    ).toBe(false);
  });

  it("does not apply when the rule is inactive", () => {
    const orderedAt = new Date("2026-01-01T18:00:00.000Z");

    expect(
      shouldApplyDeliverySurcharge({
        deliveryMethod: "DELIVERY",
        orderedAt,
        isActive: false,
      }),
    ).toBe(false);
  });
});

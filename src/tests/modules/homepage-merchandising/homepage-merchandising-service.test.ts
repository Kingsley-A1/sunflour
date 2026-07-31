import { describe, expect, it } from "vitest";
import {
  applyWeeklySaleDiscount,
  getLocalDateKey,
  isWeeklySaleActive,
} from "@/server/modules/homepage-merchandising/homepage-merchandising-service";
import {
  homepageCarouselSettingsSchema,
  weeklySaleSettingsSchema,
} from "@/server/modules/homepage-merchandising/homepage-merchandising-schemas";

const weeklySale = {
  productId: "product_1",
  discountPercent: 15,
  weekStart: "2026-07-27",
  weekEnd: "2026-08-02",
  bannerImageUrl: "/Carousel/sale-banner.png",
  cardImageUrl: "https://media.sunflour.test/sale-card.webp",
  isActive: true,
};

describe("homepage merchandising", () => {
  it("requires a weekly sale to cover exactly seven calendar days", () => {
    expect(weeklySaleSettingsSchema.safeParse(weeklySale).success).toBe(true);
    expect(
      weeklySaleSettingsSchema.safeParse({
        ...weeklySale,
        weekEnd: "2026-08-03",
      }).success,
    ).toBe(false);
  });

  it("evaluates sale dates in the configured business timezone", () => {
    const instant = new Date("2026-01-11T23:30:00.000Z");
    const winterSale = {
      ...weeklySale,
      weekStart: "2026-01-05",
      weekEnd: "2026-01-11",
    };

    expect(getLocalDateKey(instant, "Africa/Lagos")).toBe("2026-01-12");
    expect(isWeeklySaleActive(winterSale, instant, "Africa/Lagos")).toBe(false);
    expect(isWeeklySaleActive(winterSale, instant, "Europe/London")).toBe(true);
  });

  it("rounds percentage discounts to integer minor units", () => {
    expect(applyWeeklySaleDiscount(12_345, 15)).toBe(10_493);
  });

  it("accepts only internal carousel destinations and unique slide ids", () => {
    const validSlide = {
      id: "pizza",
      title: "Pizza",
      imageUrl: "/Carousel/Fajita-Pizza.png",
      altText: "Fresh pizza from Sunflour Bakery",
      href: "/menu?view=products&query=pizza",
      isActive: true,
      sortOrder: 0,
    };

    expect(
      homepageCarouselSettingsSchema.safeParse({ slides: [validSlide] }).success,
    ).toBe(true);
    expect(
      homepageCarouselSettingsSchema.safeParse({
        slides: [validSlide, { ...validSlide, sortOrder: 1 }],
      }).success,
    ).toBe(false);
    expect(
      homepageCarouselSettingsSchema.safeParse({
        slides: [{ ...validSlide, href: "https://example.com" }],
      }).success,
    ).toBe(false);
  });
});

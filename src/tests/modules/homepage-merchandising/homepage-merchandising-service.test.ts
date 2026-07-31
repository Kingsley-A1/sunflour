import { describe, expect, it } from "vitest";
import {
  findCurrentOffer,
  getLocalDateKey,
  isOfferLive,
} from "@/server/modules/homepage-merchandising/homepage-merchandising-service";
import {
  homepageCarouselSettingsSchema,
  weeklyOfferSettingsSchema,
} from "@/server/modules/homepage-merchandising/homepage-merchandising-schemas";

const weeklyOffer = {
  id: "offer-1",
  purchaseProductId: "product_1",
  freeItemLabel: "Free Coke",
  headline: "Lebanese Burger + Free Coke",
  weekStart: "2026-07-27",
  weekEnd: "2026-08-02",
  bannerImageUrl: "/Carousel/offer-banner.png",
  cardImageUrl: "https://media.sunflour.test/offer-card.webp",
  isActive: true,
};

describe("homepage merchandising", () => {
  it("accepts a valid weekly offer and rejects an inverted date range", () => {
    expect(
      weeklyOfferSettingsSchema.safeParse({ offers: [weeklyOffer] }).success,
    ).toBe(true);
    expect(
      weeklyOfferSettingsSchema.safeParse({
        offers: [{ ...weeklyOffer, weekEnd: "2026-07-20" }],
      }).success,
    ).toBe(false);
  });

  it("rejects overlapping active offers but allows drafts to collide", () => {
    const overlapping = {
      ...weeklyOffer,
      id: "offer-2",
      weekStart: "2026-07-30",
      weekEnd: "2026-08-05",
    };

    expect(
      weeklyOfferSettingsSchema.safeParse({
        offers: [weeklyOffer, overlapping],
      }).success,
    ).toBe(false);
    expect(
      weeklyOfferSettingsSchema.safeParse({
        offers: [weeklyOffer, { ...overlapping, isActive: false }],
      }).success,
    ).toBe(true);
  });

  it("allows a future offer that does not collide with the current one", () => {
    expect(
      weeklyOfferSettingsSchema.safeParse({
        offers: [
          weeklyOffer,
          {
            ...weeklyOffer,
            id: "offer-future",
            weekStart: "2026-08-03",
            weekEnd: "2026-08-09",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("picks the offer that is live today", () => {
    const during = new Date("2026-07-28T09:00:00.000Z");
    const after = new Date("2026-08-20T09:00:00.000Z");

    expect(findCurrentOffer([weeklyOffer], during)?.id).toBe("offer-1");
    expect(findCurrentOffer([weeklyOffer], after)).toBeNull();
  });

  it("evaluates offer dates in the configured business timezone", () => {
    const instant = new Date("2026-01-11T23:30:00.000Z");
    const winterOffer = {
      ...weeklyOffer,
      weekStart: "2026-01-05",
      weekEnd: "2026-01-11",
    };

    expect(getLocalDateKey(instant, "Africa/Lagos")).toBe("2026-01-12");
    expect(isOfferLive(winterOffer, instant, "Africa/Lagos")).toBe(false);
    expect(isOfferLive(winterOffer, instant, "Europe/London")).toBe(true);
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

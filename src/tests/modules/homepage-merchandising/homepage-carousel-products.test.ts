import { describe, expect, it } from "vitest";
import {
  mergeBannerLibrary,
  resolveProductSlides,
} from "@/server/modules/homepage-merchandising/homepage-merchandising-service";
import { homepageCarouselSettingsSchema } from "@/server/modules/homepage-merchandising/homepage-merchandising-schemas";

const slide = (id: string, productId?: string, imageUrl = `/Carousel/${id}.png`) => ({
  id,
  title: id,
  imageUrl,
  altText: id,
  href: "/menu",
  isActive: true,
  sortOrder: 0,
  ...(productId ? { productId } : {}),
});

describe("homepage carousel product slides", () => {
  it("remembers banners after a slide is removed", () => {
    const library = mergeBannerLibrary({ p1: "/old-p1.png", p2: "/p2.png" }, undefined, [
      slide("burger", "p1", "/new-p1.png"),
      slide("custom"),
    ]);
    expect(library).toEqual({ p1: "/new-p1.png", p2: "/p2.png" });
  });

  it("keeps current slides' banners when trimming an oversized library", () => {
    const previous = Object.fromEntries(
      Array.from({ length: 600 }, (_, index) => [`old-${index}`, `/b${index}.png`]),
    );
    const library = mergeBannerLibrary(previous, undefined, [slide("s", "live", "/live.png")]);
    expect(Object.keys(library)).toHaveLength(500);
    expect(library.live).toBe("/live.png");
    expect(library["old-599"]).toBe("/b599.png");
    expect(library["old-0"]).toBeUndefined();
  });

  it("links product slides to the current page and hides unavailable products", () => {
    const resolved = resolveProductSlides(
      [slide("custom"), slide("burger", "p1"), slide("pizza", "p2"), slide("gone", "p3"), slide("cake", "p4")],
      [
        { id: "p1", slug: "double-burger", status: "ACTIVE", categoryIsActive: true },
        { id: "p2", slug: "pizza", status: "OUT_OF_STOCK", categoryIsActive: true },
        { id: "p4", slug: "cake", status: "ACTIVE", categoryIsActive: false },
      ],
    );
    expect(resolved.map((item) => [item.id, item.href])).toEqual([
      ["custom", "/menu"],
      ["burger", "/products/double-burger"],
    ]);
  });

  it("accepts slides with a product and an optional banner library", () => {
    expect(
      homepageCarouselSettingsSchema.safeParse({
        slides: [slide("burger", "p1")],
        bannerLibrary: { p1: "/Carousel/burger.png" },
      }).success,
    ).toBe(true);
    expect(
      homepageCarouselSettingsSchema.safeParse({ slides: [slide("legacy")] }).success,
    ).toBe(true);
    expect(
      homepageCarouselSettingsSchema.safeParse({
        slides: [slide("burger", "p1")],
        bannerLibrary: { p1: "javascript:alert(1)" },
      }).success,
    ).toBe(false);
  });
});

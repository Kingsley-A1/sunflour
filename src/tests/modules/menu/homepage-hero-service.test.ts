import { describe, expect, it } from "vitest";
import {
  selectHeroProducts,
  type HeroProductCandidate,
} from "@/server/modules/menu/homepage-hero-service";
import { homepageHeroProductUpdateSchema } from "@/server/modules/menu/catalog-schemas";

type TestProduct = {
  id: string;
  name: string;
};

function candidate(
  id: string,
  source: HeroProductCandidate<TestProduct>["source"],
  rank: number,
): HeroProductCandidate<TestProduct> {
  return {
    product: {
      id,
      name: id,
    },
    source,
    rank,
  };
}

describe("homepage hero product selection", () => {
  it("keeps source priority while de-duplicating products", () => {
    const selected = selectHeroProducts([
      candidate("admin-1", "ADMIN_SELECTED", 0),
      candidate("shared", "ADMIN_SELECTED", 1),
      candidate("shared", "RECENT", 0),
      candidate("recent-1", "RECENT", 1),
      candidate("bought-1", "MOST_BOUGHT", 0),
      candidate("fallback-1", "CATALOG_FALLBACK", 0),
    ]);

    expect(selected.map((item) => item.product.id)).toEqual([
      "admin-1",
      "shared",
      "recent-1",
      "bought-1",
    ]);
  });

  it("returns fewer than four only when fewer unique products exist", () => {
    const selected = selectHeroProducts([
      candidate("one", "RECENT", 0),
      candidate("one", "MOST_BOUGHT", 0),
      candidate("two", "CATALOG_FALLBACK", 0),
    ]);

    expect(selected.map((item) => item.product.id)).toEqual(["one", "two"]);
  });
});

describe("homepage hero product admin validation", () => {
  it("accepts ordered active slot input", () => {
    const result = homepageHeroProductUpdateSchema.safeParse({
      items: [
        { productId: "product_1", sortOrder: 0, isActive: true },
        { productId: "product_2", sortOrder: 1, isActive: false },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate product slots", () => {
    const result = homepageHeroProductUpdateSchema.safeParse({
      items: [
        { productId: "product_1", sortOrder: 0, isActive: true },
        { productId: "product_1", sortOrder: 1, isActive: true },
      ],
    });

    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  hasSellablePrice,
  requiresVariantSelection,
  startingPrice,
} from "@/lib/product-pricing";

describe("product pricing", () => {
  it("treats a ₦0 product without sizes as not sellable", () => {
    expect(hasSellablePrice({ basePrice: 0, variants: [] })).toBe(false);
    expect(hasSellablePrice({ basePrice: 150_000, variants: [] })).toBe(true);
  });

  it("prices sized products from their active sizes, ignoring the base price", () => {
    const pizza = {
      basePrice: 0,
      variants: [
        { price: 1_100_000, isActive: true },
        { price: 800_000, isActive: true },
        { price: 500_000, isActive: false },
      ],
    };

    expect(hasSellablePrice(pizza)).toBe(true);
    expect(requiresVariantSelection(pizza)).toBe(true);
    expect(startingPrice(pizza)).toBe(800_000);
  });

  it("does not require a size when every option is archived", () => {
    expect(
      requiresVariantSelection({ basePrice: 200_000, variants: [{ price: 1, isActive: false }] }),
    ).toBe(false);
  });
});

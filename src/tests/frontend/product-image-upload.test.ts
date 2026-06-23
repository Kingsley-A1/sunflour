import { describe, expect, it } from "vitest";
import { buildProductImageAltText } from "@/lib/api/product-image-upload";

describe("product image upload helpers", () => {
  it("generates alt text from the product name, not the file name", () => {
    expect(buildProductImageAltText("Vanilla Cake", 0, 1)).toBe("Vanilla Cake");
    expect(buildProductImageAltText("Vanilla Cake", 1, 3)).toBe("Vanilla Cake — view 2");
  });
});

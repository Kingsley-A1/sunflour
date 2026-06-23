import { describe, expect, it } from "vitest";
import { productCreateSchema } from "@/server/modules/menu/catalog-schemas";

describe("catalog schemas", () => {
  it("requires at least one product image when creating a product", () => {
    expect(() =>
      productCreateSchema.parse({
        categoryId: "cat_1",
        name: "Chocolate Cake",
        basePrice: 150000,
        images: [],
      }),
    ).toThrow("Choose at least one product image.");
  });

  it("accepts completed image references in product creation payloads", () => {
    const result = productCreateSchema.parse({
      categoryId: "cat_1",
      name: "Chocolate Cake",
      basePrice: 150000,
      images: [
        {
          mediaAssetId: "media_1",
          altText: "Chocolate Cake",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    });

    expect(result.images).toHaveLength(1);
  });

  it("rejects duplicate image references", () => {
    expect(() =>
      productCreateSchema.parse({
        categoryId: "cat_1",
        name: "Chocolate Cake",
        basePrice: 150000,
        images: [
          { mediaAssetId: "media_1", sortOrder: 0 },
          { mediaAssetId: "media_1", sortOrder: 1 },
        ],
      }),
    ).toThrow("Choose each image only once.");
  });
});

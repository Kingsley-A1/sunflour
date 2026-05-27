import { describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/enums";
import { getProductVisibility } from "@/server/modules/menu/public-catalog";
import { buildCatalogLineItemSnapshot } from "@/server/modules/menu/product-snapshot";

describe("public catalog visibility", () => {
  it("makes active products public and orderable", () => {
    expect(
      getProductVisibility({
        status: ProductStatus.ACTIVE,
        showWhenOutOfStock: true,
      }),
    ).toEqual({
      isPublic: true,
      isOrderable: true,
    });
  });

  it("keeps hidden products out of public catalog", () => {
    expect(
      getProductVisibility({
        status: ProductStatus.HIDDEN,
        showWhenOutOfStock: true,
      }),
    ).toEqual({
      isPublic: false,
      isOrderable: false,
    });
  });

  it("can show out-of-stock products without making them orderable", () => {
    expect(
      getProductVisibility({
        status: ProductStatus.OUT_OF_STOCK,
        showWhenOutOfStock: true,
      }),
    ).toEqual({
      isPublic: true,
      isOrderable: false,
    });
  });

  it("can hide out-of-stock products when the business chooses", () => {
    expect(
      getProductVisibility({
        status: ProductStatus.OUT_OF_STOCK,
        showWhenOutOfStock: false,
      }),
    ).toEqual({
      isPublic: false,
      isOrderable: false,
    });
  });
});

describe("catalog price snapshots", () => {
  it("preserves line item values independently from later product edits", () => {
    const product = {
      productName: "Chocolate Cake",
      variantName: "Slice",
      unitPrice: 2500,
      quantity: 2,
    };
    const snapshot = buildCatalogLineItemSnapshot(product);

    product.productName = "Chocolate Cake Updated";
    product.unitPrice = 3000;

    expect(snapshot).toEqual({
      productNameSnapshot: "Chocolate Cake",
      variantNameSnapshot: "Slice",
      unitPriceSnapshot: 2500,
      quantity: 2,
      lineTotal: 5000,
    });
  });
});

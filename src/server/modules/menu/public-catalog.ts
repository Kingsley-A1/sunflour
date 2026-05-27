import { ProductStatus } from "@/generated/prisma/enums";
import type { ProductStatus as ProductStatusValue } from "@/generated/prisma/enums";

export interface ProductVisibilityInput {
  status: ProductStatusValue;
  showWhenOutOfStock: boolean;
}

export interface ProductVisibility {
  isPublic: boolean;
  isOrderable: boolean;
}

export function getProductVisibility(
  product: ProductVisibilityInput,
): ProductVisibility {
  if (product.status === ProductStatus.ACTIVE) {
    return {
      isPublic: true,
      isOrderable: true,
    };
  }

  if (
    product.status === ProductStatus.OUT_OF_STOCK &&
    product.showWhenOutOfStock
  ) {
    return {
      isPublic: true,
      isOrderable: false,
    };
  }

  return {
    isPublic: false,
    isOrderable: false,
  };
}

export function publicProductWhere() {
  return {
    OR: [
      {
        status: ProductStatus.ACTIVE,
      },
      {
        status: ProductStatus.OUT_OF_STOCK,
        showWhenOutOfStock: true,
      },
    ],
  };
}

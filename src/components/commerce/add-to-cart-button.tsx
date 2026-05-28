"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/features/cart/cart-store";
import type { PublicProduct, PublicProductVariant } from "@/types/domain";

interface AddToCartButtonProps {
  product: PublicProduct;
  variant?: PublicProductVariant;
  quantity?: number;
  className?: string;
}

export function AddToCartButton({
  product,
  variant,
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const cart = useCart();
  const { notify } = useToast();
  const image = product.images[0];
  const unitPrice = variant?.price ?? product.basePrice;
  const disabled = !product.isOrderable;

  return (
    <Button
      className={className}
      disabled={disabled}
      icon={<ShoppingCart className="h-4 w-4" aria-hidden="true" />}
      onClick={() => {
        cart.addItem({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: image?.url ?? null,
          variantId: variant?.id,
          variantName: variant?.name,
          unitPrice,
          quantity,
          isOrderable: product.isOrderable,
        });
        notify(`${product.name} added to cart.`, "success");
      }}
    >
      {disabled ? "Unavailable" : "Add to cart"}
    </Button>
  );
}

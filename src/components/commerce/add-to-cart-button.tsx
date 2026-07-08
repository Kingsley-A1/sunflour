"use client";

import { ArrowRight, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/features/cart/cart-store";
import type { PublicProduct, PublicProductVariant } from "@/types/domain";

interface AddToCartButtonProps {
  product: PublicProduct;
  variant?: PublicProductVariant;
  quantity?: number;
  className?: string;
  buttonVariant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function AddToCartButton({
  product,
  variant,
  quantity = 1,
  className,
  buttonVariant = "primary",
  size = "md",
}: AddToCartButtonProps) {
  const cart = useCart();
  const router = useRouter();
  const { notify } = useToast();
  const image = product.images[0];
  const unitPrice = variant?.price ?? product.basePrice;
  const disabled = !product.isOrderable;
  const itemKey = cart.getItemKey({
    productId: product.id,
    variantId: variant?.id,
  });
  const inCart = cart.items.some((item) => cart.getItemKey(item) === itemKey);

  if (disabled) {
    return (
      <Button
        className={className}
        disabled
        icon={<ShoppingCart className="h-4 w-4" aria-hidden="true" />}
        size={size}
        variant={buttonVariant}
      >
        Unavailable
      </Button>
    );
  }

  if (inCart) {
    return (
      <Button
        className={className}
        icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        onClick={() => router.push("/checkout")}
        size={size}
        variant={buttonVariant}
      >
        Go to checkout
      </Button>
    );
  }

  return (
    <Button
      className={className}
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
      size={size}
      variant={buttonVariant}
    >
      Add to cart
    </Button>
  );
}

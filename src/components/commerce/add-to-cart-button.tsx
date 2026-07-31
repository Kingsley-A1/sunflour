"use client";

import { ArrowRight, ShoppingBag } from "lucide-react";
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
}

export function AddToCartButton({
  product,
  variant,
  quantity = 1,
  className,
  buttonVariant = "primary",
}: AddToCartButtonProps) {
  const cart = useCart();
  const router = useRouter();
  const { notify } = useToast();
  const imageUrl = product.sale?.cardImageUrl ?? product.images[0]?.url ?? null;
  const unitPrice =
    variant?.salePrice ??
    variant?.price ??
    product.sale?.saleBasePrice ??
    product.basePrice;
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
        icon={<ShoppingBag className="h-4 w-4" aria-hidden="true" />}
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
        variant="success"
      >
        Go to checkout
      </Button>
    );
  }

  return (
    <Button
      className={className}
      icon={<ShoppingBag className="h-4 w-4" aria-hidden="true" />}
      onClick={() => {
        cart.addItem({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl,
          variantId: variant?.id,
          variantName: variant?.name,
          unitPrice,
          quantity,
          isOrderable: product.isOrderable,
        });
        notify(`${product.name} added to cart.`, "success");
      }}
      variant={buttonVariant}
    >
      Add to cart
    </Button>
  );
}

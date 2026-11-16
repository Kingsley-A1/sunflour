"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/features/cart/cart-store";
import { hasSellablePrice, requiresVariantSelection } from "@/lib/product-pricing";
import { cn } from "@/lib/utils";
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
  variant: chosenVariant,
  quantity = 1,
  className,
  buttonVariant = "primary",
}: AddToCartButtonProps) {
  // A single option is not a choice: use it directly.
  const variant =
    chosenVariant ?? (product.variants.length === 1 ? product.variants[0] : undefined);
  const cart = useCart();
  const router = useRouter();
  const { notify } = useToast();
  const imageUrl = product.images[0]?.url ?? null;
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
        icon={<ShoppingBag className="h-4 w-4" aria-hidden="true" />}
        variant={buttonVariant}
      >
        {product.status === "OUT_OF_STOCK"
          ? "Sold out"
          : !hasSellablePrice(product)
            ? "Price coming soon"
            : "Unavailable"}
      </Button>
    );
  }

  // Sized products (e.g. pizzas) are priced per option: send the customer to
  // pick one instead of silently adding the base product.
  if (!variant && requiresVariantSelection(product)) {
    return (
      <Link
        className={cn(
          "inline-flex min-h-[var(--control-height-md)] items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
          buttonVariant === "primary"
            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
            : "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
          className,
        )}
        href={`/products/${product.slug}`}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Choose size
      </Link>
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

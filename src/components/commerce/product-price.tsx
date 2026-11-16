import { PriceText } from "@/components/ui/price-text";
import { hasSellablePrice, requiresVariantSelection, startingPrice } from "@/lib/product-pricing";
import { cn } from "@/lib/utils";
import type { PublicProduct } from "@/types/domain";

interface ProductPriceProps {
  product: Pick<PublicProduct, "basePrice" | "variants">;
  className?: string;
}

/**
 * Price as a customer should read it: "From ₦8,000" for sized products, and
 * never "₦0" for something that has not been priced yet.
 */
export function ProductPrice({ product, className }: ProductPriceProps) {
  if (!hasSellablePrice(product)) {
    return (
      // Deliberately ignores the caller's price styling: this is a note, not a price.
      <span className="text-sm font-semibold text-[var(--color-text-muted)]">
        Price coming soon
      </span>
    );
  }

  if (requiresVariantSelection(product) && product.variants.length > 1) {
    return (
      <span className={cn("inline-flex items-baseline gap-1", className)}>
        <span className="text-xs font-semibold text-[var(--color-text-muted)]">From</span>
        <PriceText amount={startingPrice(product)} />
      </span>
    );
  }

  return <PriceText amount={startingPrice(product)} className={className} />;
}

/**
 * Pricing facts shared by checkout, the public catalog and the admin, so the
 * three can never disagree about whether a product can be sold.
 *
 * A product is sellable when it has a positive base price, or when it has at
 * least one active option (size/variant) with a positive price. When options
 * exist, the customer must pick one: the base price is not a valid fallback
 * for a product that is priced per size.
 */

export interface PricedVariant {
  price: number;
  isActive?: boolean;
}

export interface PricedProduct {
  basePrice: number;
  variants: readonly PricedVariant[];
}

function activeVariants(product: PricedProduct): PricedVariant[] {
  return product.variants.filter((variant) => variant.isActive !== false);
}

export function requiresVariantSelection(product: PricedProduct): boolean {
  return activeVariants(product).length > 0;
}

export function hasSellablePrice(product: PricedProduct): boolean {
  const options = activeVariants(product);

  return options.length > 0
    ? options.some((variant) => variant.price > 0)
    : product.basePrice > 0;
}

/** The lowest price a customer can pay, for "From ₦X" labels. */
export function startingPrice(product: PricedProduct): number {
  const options = activeVariants(product).filter((variant) => variant.price > 0);

  return options.length > 0
    ? Math.min(...options.map((variant) => variant.price))
    : product.basePrice;
}

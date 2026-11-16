"use client";

import { useEffect, useMemo, useState } from "react";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { ProductImageGallery } from "@/components/commerce/product-image-gallery";
import { ProductShareButton } from "@/components/commerce/product-share-button";
import { Badge } from "@/components/ui/badge";
import { PriceText } from "@/components/ui/price-text";
import { ProductPrice } from "@/components/commerce/product-price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { StatusPill } from "@/components/ui/status-pill";
import { trackJourney } from "@/lib/analytics/journey";
import type { PublicProduct, PublicProductVariant } from "@/types/domain";

interface ProductDetailClientProps {
  product: PublicProduct & {
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
  /** Set when this product is the subject of the live weekly offer. */
  offerHeadline?: string | null;
}

export function ProductDetailClient({
  product,
  offerHeadline,
}: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const selectedVariant = useMemo<PublicProductVariant | undefined>(
    () => product.variants.find((variant) => variant.id === selectedVariantId),
    [product.variants, selectedVariantId],
  );

  useEffect(() => {
    trackJourney("product_view", {
      productId: product.id,
      productSlug: product.slug,
      metadata: offerHeadline ? { weeklyOffer: true } : undefined,
    });
  }, [product.id, product.slug, offerHeadline]);
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
      <ProductImageGallery images={product.images} productName={product.name} />
      <section className="grid min-w-0 content-start gap-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="grid gap-3">
          <div className="hidden flex-wrap gap-2 sm:flex">
            <Badge tone="neutral">{product.category.name}</Badge>
            {/* Customers only need to know when they cannot order. */}
            {product.status === "OUT_OF_STOCK" ? <StatusPill status={product.status} /> : null}
          </div>
          <div>
            <h1 className="m-0 wrap-anywhere text-3xl font-extrabold leading-tight">{product.name}</h1>
            {product.description ? (
              <p className="m-0 mt-3 wrap-anywhere text-base leading-7 text-[var(--color-text-muted)]">
                {product.description}
              </p>
            ) : null}
          </div>
          <p className="m-0 text-lg">
            <span className="text-[var(--color-text-muted)]">
              {selectedVariant ? `${selectedVariant.name} ` : "Price "}
            </span>
            {selectedVariant ? (
              <PriceText amount={selectedVariant.price} className="text-2xl" />
            ) : (
              <ProductPrice className="text-2xl" product={product} />
            )}
          </p>
        </div>
        {product.variants.length > 0 ? (
          <fieldset className="grid gap-2">
            <legend className="text-sm font-bold">Choose a size</legend>
            <div className="grid gap-2">
              {product.variants.map((variant) => (
                <label
                  className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3"
                  key={variant.id}
                >
                  <span className="flex items-center gap-3">
                    <input
                      checked={selectedVariantId === variant.id}
                      name="variant"
                      onChange={() => setSelectedVariantId(variant.id)}
                      type="radio"
                    />
                    <span className="font-semibold">{variant.name}</span>
                  </span>
                  <PriceText amount={variant.price} />
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        <div className="grid gap-3">
          <div className="grid gap-3 sm:flex sm:items-center">
            <QuantityStepper onChange={setQuantity} value={quantity} />
            <AddToCartButton
              className="w-full sm:flex-1"
              product={product}
              quantity={quantity}
              variant={selectedVariant}
            />
          </div>
          <ProductShareButton
            offerHeadline={offerHeadline}
            price={selectedVariant?.price ?? product.basePrice}
            productName={product.name}
          />
        </div>
        <p className="m-0 text-xs leading-5 text-[var(--color-text-muted)]">
          Delivery fee is calculated at checkout for your area. Pickup is free.
        </p>
      </section>
    </div>
  );
}

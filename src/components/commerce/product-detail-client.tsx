"use client";

import { useMemo, useState } from "react";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { PriceText } from "@/components/ui/price-text";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { SafeImage } from "@/components/ui/safe-image";
import { StatusPill } from "@/components/ui/status-pill";
import type { PublicProduct, PublicProductVariant } from "@/types/domain";

interface ProductDetailClientProps {
  product: PublicProduct & {
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const selectedVariant = useMemo<PublicProductVariant | undefined>(
    () => product.variants.find((variant) => variant.id === selectedVariantId),
    [product.variants, selectedVariantId],
  );
  const image = product.images[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
        {image?.url ? (
          <SafeImage
            alt={image.altText ?? product.name}
            className="object-cover"
            fill
            fallback={
              <div className="grid h-full place-items-center text-lg font-bold text-[var(--color-text-muted)]">
                Image unavailable
              </div>
            }
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            src={image.url}
          />
        ) : (
          <div className="grid h-full place-items-center text-lg font-bold text-[var(--color-text-muted)]">
            Sunflour Bakery
          </div>
        )}
      </div>
      <section className="grid content-start gap-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="grid gap-3">
          <div className="hidden flex-wrap gap-2 sm:flex">
            <Badge tone="neutral">{product.category.name}</Badge>
            <StatusPill status={product.status} />
          </div>
          <div>
            <h1 className="m-0 text-3xl font-extrabold leading-tight">{product.name}</h1>
            {product.description ? (
              <p className="m-0 mt-3 text-base leading-7 text-[var(--color-text-muted)]">
                {product.description}
              </p>
            ) : null}
          </div>
          <p className="m-0 text-lg">
            <span className="text-[var(--color-text-muted)]">
              {selectedVariant ? "Selected price " : "Price "}
            </span>
            <PriceText amount={selectedVariant?.price ?? product.basePrice} className="text-2xl" />
          </p>
        </div>
        {product.variants.length > 0 ? (
          <fieldset className="grid gap-2">
            <legend className="text-sm font-bold">Choose an option</legend>
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
        <div className="grid gap-3 sm:flex sm:items-center">
          <QuantityStepper onChange={setQuantity} value={quantity} />
          <AddToCartButton
            className="w-full sm:flex-1"
            product={product}
            quantity={quantity}
            variant={selectedVariant}
          />
        </div>
        <p className="m-0 text-xs leading-5 text-[var(--color-text-muted)]">
          Displayed prices help you review the item. Checkout recalculates all
          product, variant, delivery, surcharge, and total values on the server.
        </p>
      </section>
    </div>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PriceText } from "@/components/ui/price-text";
import { SafeImage } from "@/components/ui/safe-image";
import { StatusPill } from "@/components/ui/status-pill";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import type { PublicProduct } from "@/types/domain";

interface ProductCardProps {
  product: PublicProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0];

  return (
    <div className="grid overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-raised)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:shadow-[var(--shadow-floating)]">
      <Link
        className="group block"
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-muted)]">
          {image?.url ? (
            <SafeImage
              alt={image.altText ?? product.name}
              className="object-cover transition duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-standard)] group-hover:scale-[1.02]"
              fill
              fallback={
                <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
                  Image unavailable
                </div>
              }
              sizes="(min-width: 1024px) 33vw, 50vw"
              src={image.url}
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
              Sunflour Bakery
            </div>
          )}
        </div>
      </Link>
      <div className="grid gap-2.5 p-3 sm:gap-3 sm:p-4">
        <div className="grid gap-2">
          {/* Tags are noise on the narrow mobile card — show from sm up only. */}
          <div className="hidden gap-2 sm:flex sm:flex-wrap sm:items-center">
            {product.isPopular ? <Badge tone="warning">Popular</Badge> : null}
            <StatusPill status={product.status} />
          </div>
          <div className="grid gap-1">
            <Link
              className="line-clamp-2 text-sm font-bold leading-snug text-[var(--color-text)] hover:underline sm:text-lg"
              href={`/products/${product.slug}`}
            >
              {product.name}
            </Link>
            {product.description ? (
              <p className="m-0 hidden text-sm leading-6 text-[var(--color-text-muted)] sm:line-clamp-2">
                {product.description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 text-sm font-semibold text-[var(--color-text)]">
            <PriceText amount={product.basePrice} />
          </p>
        </div>
        <AddToCartButton
          buttonVariant="secondary"
          className="w-full whitespace-nowrap"
          product={product}
          size="sm"
        />
      </div>
    </div>
  );
}

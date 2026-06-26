import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
    <Card className="grid overflow-hidden transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:shadow-[var(--shadow-floating)]">
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
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
              src={image.url}
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
              Sunflour Bakery
            </div>
          )}
        </div>
      </Link>
      <div className="grid gap-3 p-4">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {product.isPopular ? <Badge tone="warning">Popular</Badge> : null}
            <StatusPill status={product.status} />
          </div>
          <div className="grid gap-1">
            <Link
              className="text-lg font-bold leading-snug text-[var(--color-text)] hover:underline"
              href={`/products/${product.slug}`}
            >
              {product.name}
            </Link>
            {product.description ? (
              <p className="m-0 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">
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
        <AddToCartButton buttonVariant="secondary" product={product} />
      </div>
    </Card>
  );
}

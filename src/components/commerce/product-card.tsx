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
  const hasVariants = product.variants.length > 0;

  return (
    <Card className="group/card grid h-full grid-rows-[auto_1fr] overflow-hidden transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-floating)]">
      <Link
        className="group/image block overflow-hidden"
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-muted)] sm:aspect-[4/3]">
          {image?.url ? (
            <SafeImage
              alt={image.altText ?? product.name}
              className="object-cover transition duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-standard)] group-hover/image:scale-[1.025]"
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
      <div className="flex min-h-0 flex-col gap-4 p-4">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {product.isPopular ? <Badge tone="warning">Popular</Badge> : null}
            <StatusPill status={product.status} />
          </div>
          <div className="grid gap-1.5">
            <Link
              className="text-lg font-bold leading-snug text-[var(--color-text)] decoration-[var(--color-primary)] decoration-2 underline-offset-4 hover:underline"
              href={`/products/${product.slug}`}
            >
              {product.name}
            </Link>
            {product.description ? (
              <p className="m-0 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)] sm:min-h-12">
                {product.description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-auto grid gap-3 border-t border-[var(--color-border)] pt-3">
          <p className="m-0 text-base font-semibold text-[var(--color-text)]">
            {hasVariants ? <span>From </span> : null}
            <PriceText amount={product.basePrice} />
          </p>
          <AddToCartButton buttonVariant="secondary" product={product} />
        </div>
      </div>
    </Card>
  );
}

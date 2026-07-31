import Link from "next/link";
import { Flame, ShoppingBag, Sun } from "lucide-react";
import { PriceText } from "@/components/ui/price-text";
import { SafeImage } from "@/components/ui/safe-image";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import type { PublicProduct } from "@/types/domain";

interface ProductCardProps {
  product: PublicProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0];
  const imageUrl = product.sale?.cardImageUrl ?? image?.url;

  return (
    <article className="group grid min-w-0 overflow-hidden rounded-[var(--radius-product)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-raised)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-floating)]">
      <Link
        className="group block"
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-square overflow-hidden bg-[var(--color-surface-muted)]">
          {imageUrl ? (
            <SafeImage
              alt={image?.altText ?? product.name}
              className="object-cover transition duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-standard)] group-hover:scale-[1.02]"
              fill
              fallback={
                <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
                  Image unavailable
                </div>
              }
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              src={imageUrl}
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
              Sunflour Bakery
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.sale ? (
              <span className="rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-extrabold text-[var(--color-on-primary)] shadow-[var(--shadow-raised)]">
                {product.sale.discountPercent}% off this week
              </span>
            ) : product.status === "OUT_OF_STOCK" ? (
              <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-floating)] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)] shadow-[var(--shadow-raised)]">
                <span className="inline-flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  Sold out
                </span>
              </span>
            ) : product.isPopular ? (
              <span className="rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-extrabold text-[var(--color-on-primary)] shadow-[var(--shadow-raised)]">
                <span className="inline-flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  Popular
                </span>
              </span>
            ) : null}
          </div>
          <span className="absolute bottom-0 right-0 grid h-10 w-10 place-items-center rounded-tl-[var(--radius-product)] bg-[var(--color-accent)] text-[var(--color-on-accent)]">
            <Sun className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
      </Link>
      <div className="grid content-start gap-3 p-4">
        <div className="grid content-start gap-1">
          <Link
            className="line-clamp-2 min-h-[3rem] text-lg font-extrabold leading-snug text-[var(--color-text)] hover:underline"
            href={`/products/${product.slug}`}
          >
            {product.name}
          </Link>
          {product.description ? (
            <p className="m-0 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--color-text-muted)]">
              {product.description}
            </p>
          ) : (
            <span className="min-h-12" aria-hidden="true" />
          )}
        </div>
        <div className="flex min-h-7 flex-wrap items-baseline gap-2">
          {product.sale ? (
            <PriceText
              amount={product.sale.originalBasePrice}
              className="text-sm !text-[var(--color-text-muted)] line-through"
            />
          ) : null}
          <PriceText
            amount={product.sale?.saleBasePrice ?? product.basePrice}
            className="text-xl font-extrabold !text-[var(--color-primary)]"
          />
        </div>
        <AddToCartButton className="w-full" product={product} />
      </div>
    </article>
  );
}

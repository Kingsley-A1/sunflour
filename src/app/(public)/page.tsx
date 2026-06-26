import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { ProductGrid } from "@/components/commerce/product-grid";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { FeatureCarousel } from "@/components/ui/feature-carousel";
import { PriceText } from "@/components/ui/price-text";
import { SafeImage } from "@/components/ui/safe-image";
import {
  getHomepageHeroProductsSafe,
  getPublicMenuSafe,
} from "@/lib/api/server";
import type { PublicHeroProduct } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ menu, error }, { products: heroProducts, error: heroError }] =
    await Promise.all([getPublicMenuSafe(), getHomepageHeroProductsSafe()]);
  const popularProducts =
    menu?.categories
      .flatMap((category) => category.products)
      .filter((product) => product.isPopular || product.isFeatured)
      .slice(0, 4) ?? [];

  return (
    <main>
      <section className="bg-[var(--color-canvas-muted)]">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:py-10">
          <div className="max-w-3xl">
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Fresh from Sunflour Bakery
            </p>
            <h1 className="m-0 mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
              Warm bakes, ready for pickup or delivery.
            </h1>
          </div>

          {heroError ? (
            <ErrorState description={heroError} title="Hero products unavailable" />
          ) : heroProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {heroProducts.map((product) => (
                <HeroProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <ErrorState
              description="Add active products in the admin catalog to show homepage hero products."
              title="No products to show yet"
            />
          )}
          <div className="grid grid-cols-2 gap-2 sm:max-w-xl">
            <Link
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 text-sm font-bold text-[var(--color-on-primary)] sm:text-base"
              href="/menu"
            >
              View menu
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] sm:text-base"
              href="/cart"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Review cart
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Popular picks
            </p>
            <h2 className="m-0 mt-1 text-3xl font-extrabold">Start with the menu</h2>
          </div>
          <Link className="text-sm font-bold text-[var(--color-primary)] hover:underline" href="/menu">
            See all products
          </Link>
        </div>
        {error ? (
          <ErrorState description={error} title="Menu unavailable" />
        ) : (
          <ProductGrid products={popularProducts} />
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <FeatureCarousel />
      </section>
    </main>
  );
}

function HeroProductCard({ product }: { product: PublicHeroProduct }) {
  const image = product.images[0];

  return (
    <Link
      aria-label={`View ${product.name}`}
      className="group grid min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-raised)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:shadow-[var(--shadow-floating)]"
      href={`/products/${product.slug}`}
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--color-surface-muted)]">
        {image?.url ? (
          <SafeImage
            alt={image.altText ?? product.name}
            className="object-cover transition duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-standard)] group-hover:scale-[1.02]"
            fill
            fallback={
              <HeroImageFallback productName={product.name} />
            }
            sizes="(min-width: 1024px) 18vw, 45vw"
            src={image.url}
          />
        ) : (
          <HeroImageFallback productName={product.name} />
        )}
      </div>
      <div className="grid min-w-0 gap-2 p-3">
        <Badge className="w-fit max-w-full truncate" tone="neutral">
          {product.category.name}
        </Badge>
        <h2 className="m-0 line-clamp-2 text-sm font-extrabold leading-snug text-[var(--color-text)] sm:text-base">
          {product.name}
        </h2>
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          <PriceText amount={product.basePrice} />
        </p>
      </div>
    </Link>
  );
}

function HeroImageFallback({ productName }: { productName: string }) {
  return (
    <div className="grid h-full place-items-center px-3 text-center text-sm font-bold text-[var(--color-text-muted)]">
      {productName}
    </div>
  );
}

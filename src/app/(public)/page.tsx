import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { ProductGrid } from "@/components/commerce/product-grid";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { FeatureCarousel } from "@/components/ui/feature-carousel";
import { PriceText } from "@/components/ui/price-text";
import { SafeImage } from "@/components/ui/safe-image";
import {
  getHomepageHeroProductsSafe,
  getPublicMenuSafe,
} from "@/lib/api/server";
import { getResolvedPublicContactConfig } from "@/server/config/public-contact";
import { buildBakeryJsonLd } from "@/lib/seo/structured-data";
import type { PublicHeroProduct } from "@/types/domain";

export const dynamic = "force-dynamic";

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [{ menu, error }, { products: heroProducts, error: heroError }, contact] =
    await Promise.all([
      getPublicMenuSafe(),
      getHomepageHeroProductsSafe(),
      getResolvedPublicContactConfig(),
    ]);
  // Show a fuller menu preview on the homepage: lead with popular/featured
  // products, then backfill with the rest of the catalog so shoppers always
  // see a healthy set (up to 8) before the quality cards.
  const HOMEPAGE_PRODUCT_LIMIT = 8;
  const allProducts =
    menu?.categories.flatMap((category) => category.products) ?? [];
  const isHighlighted = (product: (typeof allProducts)[number]) =>
    product.isPopular || product.isFeatured;
  const popularProducts = [
    ...allProducts.filter(isHighlighted),
    ...allProducts.filter((product) => !isHighlighted(product)),
  ].slice(0, HOMEPAGE_PRODUCT_LIMIT);

  return (
    <main>
      <JsonLd data={buildBakeryJsonLd(contact)} />
      <section className="sf-hero-surface border-b border-[var(--color-border)]">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 py-12 lg:py-16">
          <div className="max-w-3xl">
            <h1 className="m-0 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Warm bakes, ready for{" "}
              <span className="sf-text-gradient">pickup or delivery.</span>
            </h1>
          </div>

          {heroError ? (
            <ErrorState description={heroError} title="Hero products unavailable" />
          ) : heroProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
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
    <div className="group grid min-w-0 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-raised)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:shadow-[var(--shadow-floating)]">
      <Link
        aria-label={`View ${product.name}`}
        className="block"
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
      </Link>
      <div className="grid min-w-0 gap-2 p-3">
        <Badge className="w-fit max-w-full truncate" tone="neutral">
          {product.category.name}
        </Badge>
        <Link
          className="line-clamp-2 text-sm font-extrabold leading-snug text-[var(--color-text)] hover:underline sm:text-base"
          href={`/products/${product.slug}`}
        >
          {product.name}
        </Link>
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          <PriceText amount={product.basePrice} />
        </p>
        <AddToCartButton
          buttonVariant="secondary"
          className="mt-1 w-full"
          product={product}
        />
      </div>
    </div>
  );
}

function HeroImageFallback({ productName }: { productName: string }) {
  return (
    <div className="grid h-full place-items-center px-3 text-center text-sm font-bold text-[var(--color-text-muted)]">
      {productName}
    </div>
  );
}

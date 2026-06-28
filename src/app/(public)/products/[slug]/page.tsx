import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/commerce/product-detail-client";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublicProductSafe } from "@/lib/api/server";
import { buildProductJsonLd } from "@/lib/seo/structured-data";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function productDescription(name: string, description: string | null): string {
  if (description && description.trim().length > 0) {
    return description.trim().slice(0, 160);
  }

  return `Order ${name} from Sunflour Bakery in Calabar for pickup or delivery.`;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getPublicProductSafe(slug);

  if (!product) {
    return { title: "Product not found" };
  }

  const description = productDescription(product.name, product.description);
  const image = product.images.find((entry) => entry.url)?.url ?? undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { product } = await getPublicProductSafe(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={buildProductJsonLd(product, product.category.name)} />
      <ProductDetailClient product={product} />
    </main>
  );
}

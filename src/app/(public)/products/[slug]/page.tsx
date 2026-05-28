import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/commerce/product-detail-client";
import { getPublicProductSafe } from "@/lib/api/server";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { product } = await getPublicProductSafe(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <ProductDetailClient product={product} />
    </main>
  );
}

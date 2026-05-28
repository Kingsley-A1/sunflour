import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/commerce/product-card";
import type { PublicProduct } from "@/types/domain";

interface ProductGridProps {
  products: PublicProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try another search term or category."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

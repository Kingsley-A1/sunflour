import { redirect } from "next/navigation";
import type { Route } from "next";
import { CheckCircle2 } from "lucide-react";
import { HomepageHeroProductsClient } from "@/components/admin/homepage-hero-products-client";
import { ProductAdminClient } from "@/components/admin/product-admin-client";
import { ProductsViewTabs } from "@/components/admin/products-view-tabs";
import { ErrorState } from "@/components/ui/error-state";
import { getAdminCatalogSafe } from "@/lib/api/server";
import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_ADMIN_ROLES } from "@/server/auth/roles";
import { countProductDraftsForUser } from "@/server/modules/menu";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Products",
};

interface AdminProductsPageProps {
  searchParams: Promise<{ view?: string; created?: string }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const user = await requireRole(PRODUCT_ADMIN_ROLES);
  const { view, created } = await searchParams;
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  // Old links used a query string for drafts; drafts now have their own page.
  if (isSuperAdmin && view === "drafts") {
    redirect("/admin/products/drafts" as Route);
  }

  const [catalog, draftCount] = await Promise.all([
    getAdminCatalogSafe(),
    isSuperAdmin
      ? countProductDraftsForUser(user).catch(() => 0)
      : Promise.resolve(0),
  ]);
  const { products, categories, heroProducts, error } = catalog;

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="m-0 text-2xl font-extrabold sm:text-3xl">Products</h1>
        <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
          Everything on the Sunflour menu, with price and availability.
        </p>
      </header>
      {created === "1" ? (
        <p
          className="m-0 flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success-text)]"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Product created. Its draft was removed automatically.
        </p>
      ) : null}
      {isSuperAdmin ? (
        <ProductsViewTabs
          active="products"
          draftCount={draftCount}
          productCount={products.length}
        />
      ) : null}
      {error ? <ErrorState description={error} title="Catalog unavailable" /> : null}
      <ProductAdminClient categories={categories} products={products} role={user.role} />
      <HomepageHeroProductsClient
        heroProducts={heroProducts}
        products={products}
        role={user.role}
      />
    </div>
  );
}

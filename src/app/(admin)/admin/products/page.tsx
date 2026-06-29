import Link from "next/link";
import type { Route } from "next";
import { HomepageHeroProductsClient } from "@/components/admin/homepage-hero-products-client";
import { ProductAdminClient } from "@/components/admin/product-admin-client";
import { ProductDraftsList } from "@/components/admin/product-drafts-list";
import { ErrorState } from "@/components/ui/error-state";
import { getAdminCatalogSafe, getAdminProductDraftsSafe } from "@/lib/api/server";
import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_ADMIN_ROLES } from "@/server/auth/roles";
import type { AdminProductDraft } from "@/types/domain";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Products",
};

interface AdminProductsPageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const user = await requireRole(PRODUCT_ADMIN_ROLES);
  const { view } = await searchParams;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const showDrafts = isSuperAdmin && view === "drafts";

  const [catalog, draftsResult] = await Promise.all([
    getAdminCatalogSafe(),
    isSuperAdmin
      ? getAdminProductDraftsSafe(user)
      : Promise.resolve({
          drafts: [] as AdminProductDraft[],
          error: null as string | null,
        }),
  ]);
  const { products, categories, heroProducts, error } = catalog;

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Catalog</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Products</h1>
      </header>
      {isSuperAdmin ? (
        <nav
          aria-label="Product views"
          className="flex gap-2 overflow-x-auto"
        >
          <Link
            className={productViewTabClass(!showDrafts)}
            href={"/admin/products" as Route}
          >
            All products ({products.length})
          </Link>
          <Link
            className={productViewTabClass(showDrafts)}
            href={"/admin/products?view=drafts" as Route}
          >
            Draft products ({draftsResult.drafts.length})
          </Link>
        </nav>
      ) : null}
      {showDrafts ? (
        <ProductDraftsList drafts={draftsResult.drafts} error={draftsResult.error} />
      ) : (
        <>
          {error ? <ErrorState description={error} title="Catalog unavailable" /> : null}
          <HomepageHeroProductsClient
            heroProducts={heroProducts}
            products={products}
            role={user.role}
          />
          <ProductAdminClient categories={categories} products={products} role={user.role} />
        </>
      )}
    </div>
  );
}

function productViewTabClass(active: boolean): string {
  return active
    ? "min-h-11 shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-on-primary)]"
    : "min-h-11 shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]";
}

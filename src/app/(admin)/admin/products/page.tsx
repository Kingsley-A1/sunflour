import { ProductAdminClient } from "@/components/admin/product-admin-client";
import { ErrorState } from "@/components/ui/error-state";
import { getAdminCatalogSafe } from "@/lib/api/server";
import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Products",
};

export default async function AdminProductsPage() {
  const user = await requireRole(ADMIN_ROLES);
  const { products, categories, error } = await getAdminCatalogSafe();

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Catalog</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Products</h1>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Update availability safely. Product prices are backend-controlled and
          old invoices keep their snapshots.
        </p>
      </header>
      {error ? <ErrorState description={error} title="Catalog unavailable" /> : null}
      <ProductAdminClient categories={categories} products={products} role={user.role} />
    </div>
  );
}

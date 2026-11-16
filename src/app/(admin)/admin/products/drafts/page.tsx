import { ProductDraftsList } from "@/components/admin/product-drafts-list";
import { ProductsViewTabs } from "@/components/admin/products-view-tabs";
import { getAdminCatalogSafe, getAdminProductDraftsSafe } from "@/lib/api/server";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Product Drafts",
};

export default async function AdminProductDraftsPage() {
  const user = await requireRole(SUPER_ADMIN_ROLES);
  const [catalog, draftsResult] = await Promise.all([
    getAdminCatalogSafe(),
    getAdminProductDraftsSafe(user),
  ]);

  const categoryNames = Object.fromEntries(
    catalog.categories.map((category) => [category.id, category.name]),
  );
  const existingProductNames = catalog.products.map((product) =>
    product.name.trim().toLowerCase(),
  );

  return (
    <div className="grid gap-5">
      <header>
        <div>
          <h1 className="m-0 text-2xl font-extrabold sm:text-3xl">Drafts</h1>
          <p className="m-0 mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">
            Products you started but have not created yet. Drafts are private to
            you and never appear on the menu.
          </p>
        </div>
      </header>
      <ProductsViewTabs
        active="drafts"
        draftCount={draftsResult.drafts.length}
        productCount={catalog.products.length}
      />
      <ProductDraftsList
        categoryNames={categoryNames}
        drafts={draftsResult.drafts}
        error={draftsResult.error}
        existingProductNames={existingProductNames}
      />
    </div>
  );
}

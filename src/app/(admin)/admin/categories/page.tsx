import { CategoryManagerClient } from "@/components/admin/category-manager-client";
import { ErrorState } from "@/components/ui/error-state";
import { getAdminCatalogSafe } from "@/lib/api/server";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Categories",
};

export default async function AdminCategoriesPage() {
  await requireRole(SUPER_ADMIN_ROLES);
  const { categories, error } = await getAdminCatalogSafe();

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Catalog</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Categories</h1>
      </header>
      {error ? <ErrorState description={error} title="Categories unavailable" /> : null}
      <CategoryManagerClient categories={categories} />
    </div>
  );
}

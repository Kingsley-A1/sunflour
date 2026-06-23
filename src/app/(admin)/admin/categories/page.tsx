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
  const activeCategories = categories.filter((category) => category.isActive).length;

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
        <div>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Catalog</p>
          <h1 className="m-0 mt-2 text-3xl font-extrabold">Categories</h1>
          <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Manage the storefront category structure used by products and menu
            browsing. Keep the taxonomy small, named clearly, and ordered on
            purpose.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
            <p className="m-0 text-sm text-[var(--color-text-muted)]">Configured</p>
            <p className="m-0 mt-2 text-2xl font-extrabold">{categories.length}</p>
          </article>
          <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
            <p className="m-0 text-sm text-[var(--color-text-muted)]">Visible</p>
            <p className="m-0 mt-2 text-2xl font-extrabold">{activeCategories}</p>
          </article>
          <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
            <p className="m-0 text-sm text-[var(--color-text-muted)]">Hidden</p>
            <p className="m-0 mt-2 text-2xl font-extrabold">
              {categories.length - activeCategories}
            </p>
          </article>
        </div>
      </header>
      {error ? <ErrorState description={error} title="Categories unavailable" /> : null}
      <CategoryManagerClient categories={categories} />
    </div>
  );
}

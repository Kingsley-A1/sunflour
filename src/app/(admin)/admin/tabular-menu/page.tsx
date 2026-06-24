import { TabularMenuManagerClient } from "@/components/admin/tabular-menu-manager-client";
import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";
import { getTabularMenuContentForAdmin } from "@/server/modules/menu";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tabular Menu",
};

export default async function AdminTabularMenuPage() {
  await requireRole(PRODUCT_CONTENT_ROLES);
  const tabularMenu = await getTabularMenuContentForAdmin();

  return (
    <div className="grid gap-6">
      <header className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
        <div>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
            Menu content
          </p>
          <h1 className="m-0 mt-2 text-3xl font-extrabold">Tabular menu</h1>
          <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Manage the quick-reference menu that appears in the second Menu tab.
            This surface controls public category labels, menu descriptions,
            image links, and reference price rows without changing trusted
            checkout pricing.
          </p>
        </div>
      </header>

      <TabularMenuManagerClient initialMenu={tabularMenu} />
    </div>
  );
}

import { BusinessSettingsClient } from "@/components/admin/business-settings-client";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Business Profile Settings",
};

export default async function AdminBusinessSettingsPage() {
  await requireRole(SUPER_ADMIN_ROLES);

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Settings
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">
          Business profile
        </h1>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Manage the public business name, contact details, address, and social
          links shown across Sunflour customer pages.
        </p>
      </header>
      <BusinessSettingsClient />
    </div>
  );
}

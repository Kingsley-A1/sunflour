import { BusinessSettingsClient } from "@/components/admin/business-settings-client";
import { EmailSettingsClient } from "@/components/admin/email-settings-client";
import { PaymentSettingsClient } from "@/components/admin/payment-settings-client";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Platform Settings",
};

export default async function AdminSettingsPage() {
  await requireRole(SUPER_ADMIN_ROLES);

  return (
    <div className="grid gap-6">
      <header className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
        <div>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
            Settings
          </p>
          <h1 className="m-0 mt-2 text-3xl font-extrabold">
            Platform settings
          </h1>
          <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Manage the public business profile, payment instructions, and
            transactional communication from one controlled super-admin surface.
          </p>
        </div>
      </header>

      <BusinessSettingsClient />

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <PaymentSettingsClient />
        <EmailSettingsClient />
      </div>
    </div>
  );
}

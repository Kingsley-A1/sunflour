import { PaymentSettingsClient } from "@/components/admin/payment-settings-client";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payment Settings",
};

export default async function AdminPaymentSettingsPage() {
  await requireRole(SUPER_ADMIN_ROLES);

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Settings</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Payment settings</h1>
      </header>
      <PaymentSettingsClient />
    </div>
  );
}

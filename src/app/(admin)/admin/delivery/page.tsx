import { DeliverySettingsClient } from "@/components/admin/delivery-settings-client";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Delivery",
};

export default async function AdminDeliveryPage() {
  await requireRole(SUPER_ADMIN_ROLES);

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Delivery</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Zones and surcharge</h1>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Base delivery fee and after-hours surcharge are managed separately by
          the backend and snapshotted on orders.
        </p>
      </header>
      <DeliverySettingsClient />
    </div>
  );
}

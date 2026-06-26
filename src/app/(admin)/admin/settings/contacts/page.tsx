import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { ContactSettingsClient } from "@/components/admin/contact-settings-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Settings",
};

export default async function ContactSettingsPage() {
  await requireRole(SUPER_ADMIN_ROLES);

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Settings</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Contact settings</h1>
        <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Update the contact details displayed on the public contact page and site footer.
          Changes take effect immediately.
        </p>
      </header>
      <ContactSettingsClient />
    </div>
  );
}

import Link from "next/link";
import type { Route } from "next";
import { Building2, CreditCard, Mail, Phone, ShieldCheck, Truck } from "lucide-react";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Platform Settings",
};

const settingsLinks = [
  {
    href: "/admin/settings/business" as Route,
    label: "Business profile",
    description: "Public business name, contact details, address, and social links.",
    icon: Building2,
  },
  {
    href: "/admin/settings/contacts" as Route,
    label: "Contact settings",
    description: "Phone, WhatsApp, email, social handles, and address shown on the public contact page.",
    icon: Phone,
  },
  {
    href: "/admin/settings/payment" as Route,
    label: "Payment settings",
    description: "Moniepoint bank-transfer instructions used by future orders.",
    icon: CreditCard,
  },
  {
    href: "/admin/settings/email" as Route,
    label: "Transactional email",
    description: "Approved order, invoice, password reset, and admin alert templates.",
    icon: Mail,
  },
  {
    href: "/admin/delivery" as Route,
    label: "Delivery rules",
    description: "Delivery zones, base fees, and the 6 PM surcharge.",
    icon: Truck,
  },
  {
    href: "/admin/audit-logs" as Route,
    label: "Audit logs",
    description: "A plain-language record of sensitive admin changes.",
    icon: ShieldCheck,
  },
];

export default async function AdminSettingsPage() {
  await requireRole(SUPER_ADMIN_ROLES);

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Settings
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">
          Platform settings
        </h1>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Choose the specific setting you need. Sensitive changes remain
          super-admin only and are audited by the backend.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {settingsLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="grid min-h-40 gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)] transition duration-[var(--motion-duration-fast)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <div>
                <h2 className="m-0 text-lg font-bold">{item.label}</h2>
                <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

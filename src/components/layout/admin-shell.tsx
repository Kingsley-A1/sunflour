import Link from "next/link";
import type { Route } from "next";
import {
  ClipboardList,
  LayoutDashboard,
  Mail,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  MessageSquareText,
} from "lucide-react";
import type { UserRole } from "@/types/domain";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  role: UserRole;
  children: React.ReactNode;
}

const adminNavItems = [
  {
    href: "/admin" as Route,
    label: "Dashboard",
    icon: LayoutDashboard,
    allowedRoles: [
      "ATTENDANT",
      "MEDIA_MANAGER",
      "MODERATOR",
      "SUPER_ADMIN",
    ] as const,
  },
  {
    href: "/admin/orders" as Route,
    label: "Orders",
    icon: ClipboardList,
    allowedRoles: ["ATTENDANT", "MODERATOR", "SUPER_ADMIN"] as const,
  },
  {
    href: "/admin/products" as Route,
    label: "Products",
    icon: Package,
    allowedRoles: ["MEDIA_MANAGER", "MODERATOR", "SUPER_ADMIN"] as const,
  },
  {
    href: "/admin/delivery" as Route,
    label: "Delivery",
    icon: Truck,
    allowedRoles: ["SUPER_ADMIN"] as const,
  },
  {
    href: "/admin/reviews" as Route,
    label: "Reviews",
    icon: MessageSquareText,
    allowedRoles: ["MODERATOR", "SUPER_ADMIN"] as const,
  },
  {
    href: "/admin/settings/email" as Route,
    label: "Email",
    icon: Mail,
    allowedRoles: ["SUPER_ADMIN"] as const,
  },
  {
    href: "/admin/settings/payment" as Route,
    label: "Payment",
    icon: Settings,
    allowedRoles: ["SUPER_ADMIN"] as const,
  },
  {
    href: "/admin/audit-logs" as Route,
    label: "Audit logs",
    icon: ShieldCheck,
    allowedRoles: ["SUPER_ADMIN"] as const,
  },
];

function canSee(
  role: UserRole,
  allowedRoles: readonly Exclude<UserRole, "CUSTOMER">[],
) {
  return allowedRoles.includes(role as Exclude<UserRole, "CUSTOMER">);
}

export function AdminShell({ role, children }: AdminShellProps) {
  return (
    <div className="min-h-svh bg-[var(--color-bg)] text-[var(--color-text)] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:min-h-svh lg:border-b-0 lg:border-r">
        <div className="grid gap-4 p-4">
          <Link className="text-lg font-extrabold" href="/admin">
            Sunflour Admin
          </Link>
          <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
            Role: {role.replace("_", " ").toLowerCase()}
          </p>
          <nav className="flex gap-2 overflow-x-auto lg:grid" aria-label="Admin navigation">
            {adminNavItems
              .filter((item) => canSee(role, item.allowedRoles))
              .map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div>
              <p className="m-0 text-sm font-bold">Operations</p>
              <p className="m-0 text-xs text-[var(--color-text-muted)]">
                Process orders, control menu availability, and manage approved
                business settings.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-semibold"
              href="/"
            >
              Public site
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquareText,
  Package,
  Settings,
  ShieldCheck,
  Tags,
  Truck,
  UsersRound,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";
import type { UserRole } from "@/types/domain";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  role: UserRole;
  children: React.ReactNode;
}

export const adminNavItems = [
  { href: "/admin" as Route, label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["ATTENDANT", "MEDIA_MANAGER", "MODERATOR", "SUPER_ADMIN"] as const },
  { href: "/admin/orders" as Route, label: "Orders", icon: ClipboardList, allowedRoles: ["ATTENDANT", "MODERATOR", "SUPER_ADMIN"] as const },
  { href: "/admin/products" as Route, label: "Products", icon: Package, allowedRoles: ["MEDIA_MANAGER", "MODERATOR", "SUPER_ADMIN"] as const },
  { href: "/admin/categories" as Route, label: "Categories", icon: Tags, allowedRoles: ["SUPER_ADMIN"] as const },
  { href: "/admin/delivery" as Route, label: "Delivery", icon: Truck, allowedRoles: ["SUPER_ADMIN"] as const },
  { href: "/admin/users" as Route, label: "Users", icon: UsersRound, allowedRoles: ["SUPER_ADMIN"] as const },
  { href: "/admin/reviews" as Route, label: "Reviews", icon: MessageSquareText, allowedRoles: ["MODERATOR", "SUPER_ADMIN"] as const },
  { href: "/admin/settings/email" as Route, label: "Email", icon: Mail, allowedRoles: ["SUPER_ADMIN"] as const },
  { href: "/admin/settings/payment" as Route, label: "Payment", icon: Settings, allowedRoles: ["SUPER_ADMIN"] as const },
  { href: "/admin/audit-logs" as Route, label: "Audit logs", icon: ShieldCheck, allowedRoles: ["SUPER_ADMIN"] as const },
];

function canSee(role: UserRole, allowedRoles: readonly Exclude<UserRole, "CUSTOMER">[]) {
  return allowedRoles.includes(role as Exclude<UserRole, "CUSTOMER">);
}

function isCurrentRoute(pathname: string, href: Route) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNavigation({
  collapsed,
  pathname,
  role,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  role: UserRole;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-1" aria-label="Admin navigation">
      {adminNavItems
        .filter((item) => canSee(role, item.allowedRoles))
        .map((item) => {
          const Icon = item.icon;
          const active = isCurrentRoute(pathname, item.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]",
                active
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-raised)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
                collapsed && "justify-center px-0",
              )}
              href={item.href}
              key={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className={collapsed ? "sr-only" : undefined}>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}

export function AdminShell({ role, children }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className={cn(
        "min-h-svh bg-[var(--color-canvas)] text-[var(--color-text)] lg:grid",
        collapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[260px_1fr]",
      )}
    >
      <aside className="hidden min-h-svh border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
        <div className="sticky top-0 grid gap-4 p-4">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
            <Link className={cn("font-extrabold", collapsed ? "text-xl" : "text-lg")} href="/admin" title="Sunflour Admin">
              {collapsed ? "S" : "Sunflour Admin"}
            </Link>
            {!collapsed ? (
              <IconButton
                icon={<ChevronLeft className="h-5 w-5" aria-hidden="true" />}
                label="Collapse admin sidebar"
                onClick={() => setCollapsed(true)}
              />
            ) : null}
          </div>
          {collapsed ? (
            <IconButton
              className="mx-auto"
              icon={<ChevronRight className="h-5 w-5" aria-hidden="true" />}
              label="Expand admin sidebar"
              onClick={() => setCollapsed(false)}
            />
          ) : (
            <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold capitalize text-[var(--color-text-muted)]">
              Role: {role.replace("_", " ").toLowerCase()}
            </p>
          )}
          <AdminNavigation collapsed={collapsed} pathname={pathname} role={role} />
        </div>
      </aside>

      <Sheet
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        panelClassName="max-w-sm"
        title="Sunflour Admin"
      >
        <div className="grid gap-4">
          <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold capitalize text-[var(--color-text-muted)]">
            Role: {role.replace("_", " ").toLowerCase()}
          </p>
          <AdminNavigation
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
            pathname={pathname}
            role={role}
          />
        </div>
      </Sheet>

      <div className="min-w-0">
        <header className="sticky top-0 z-[var(--layer-header)] border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <IconButton
                className="shrink-0 lg:hidden"
                icon={<Menu className="h-5 w-5" aria-hidden="true" />}
                label="Open admin navigation"
                onClick={() => setMobileOpen(true)}
              />
              <div className="min-w-0">
                <p className="m-0 text-sm font-bold">Operations</p>
                <p className="m-0 hidden truncate text-xs text-[var(--color-text-muted)] sm:block">
                  Process orders, control menu availability, and manage approved business settings.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex min-h-11 shrink-0 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-semibold hover:bg-[var(--color-surface-muted)]"
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

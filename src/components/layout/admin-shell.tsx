"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  Mail,
  Menu,
  MessageSquareText,
  Package,
  Phone,
  PlusCircle,
  Settings,
  ShieldCheck,
  Tags,
  Truck,
  UsersRound,
} from "lucide-react";
import logoAsset from "../../../public/logo.png";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";
import type { UserRole } from "@/types/domain";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  role: UserRole;
  userName?: string | null;
  userEmail?: string | null;
  children: React.ReactNode;
}

export const adminNavItems = [
  { href: "/admin" as Route, label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["ATTENDANT", "MEDIA_MANAGER", "MODERATOR", "SUPER_ADMIN"] as const },
  { href: "/admin/orders" as Route, label: "Orders", icon: ClipboardList, allowedRoles: ["ATTENDANT", "MODERATOR", "SUPER_ADMIN"] as const },
  { href: "/admin/products" as Route, label: "Products", icon: Package, allowedRoles: ["MEDIA_MANAGER", "MODERATOR", "SUPER_ADMIN"] as const },
  { href: "/admin/products/new" as Route, label: "New product", icon: PlusCircle, allowedRoles: ["SUPER_ADMIN"] as const },
  { href: "/admin/tabular-menu" as Route, label: "Tabular menu", icon: ListOrdered, allowedRoles: ["MEDIA_MANAGER", "SUPER_ADMIN"] as const },
  { href: "/admin/categories" as Route, label: "Categories", icon: Tags, allowedRoles: ["SUPER_ADMIN"] as const },
  { href: "/admin/delivery" as Route, label: "Delivery", icon: Truck, allowedRoles: ["SUPER_ADMIN"] as const },
  { href: "/admin/users" as Route, label: "Users", icon: UsersRound, allowedRoles: ["SUPER_ADMIN"] as const },
  { href: "/admin/reviews" as Route, label: "Reviews", icon: MessageSquareText, allowedRoles: ["MODERATOR", "SUPER_ADMIN"] as const },
  {
    href: "/admin/settings" as Route,
    label: "Settings",
    icon: Settings,
    allowedRoles: ["SUPER_ADMIN"] as const,
    children: [
      { href: "/admin/settings/business" as Route, label: "Business profile", icon: Building2, allowedRoles: ["SUPER_ADMIN"] as const },
      { href: "/admin/settings/payment" as Route, label: "Payment", icon: CreditCard, allowedRoles: ["SUPER_ADMIN"] as const },
      { href: "/admin/settings/email" as Route, label: "Email", icon: Mail, allowedRoles: ["SUPER_ADMIN"] as const },
      { href: "/admin/settings/contacts" as Route, label: "Contacts", icon: Phone, allowedRoles: ["SUPER_ADMIN"] as const },
    ],
  },
  { href: "/admin/audit-logs" as Route, label: "Audit logs", icon: ShieldCheck, allowedRoles: ["SUPER_ADMIN"] as const },
];

function canSee(role: UserRole, allowedRoles: readonly Exclude<UserRole, "CUSTOMER">[]) {
  return allowedRoles.includes(role as Exclude<UserRole, "CUSTOMER">);
}

function isCurrentRoute(pathname: string, href: Route) {
  if (href === "/admin") {
    return pathname === href;
  }
  // Exact match for the create page so it doesn't also light up "Products".
  if (href === "/admin/products/new") {
    return pathname === href;
  }
  if (href === "/admin/products") {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) && pathname !== "/admin/products/new")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
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
          const visibleChildren = item.children?.filter((child) =>
            canSee(role, child.allowedRoles),
          );

          return (
            <div className="grid gap-1" key={item.href}>
              <Link
                aria-current={active && pathname === item.href ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]",
                  active
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-raised)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
                  collapsed && "justify-center px-0",
                )}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className={collapsed ? "sr-only" : undefined}>{item.label}</span>
              </Link>
              {!collapsed && visibleChildren?.length ? (
                <div className="ml-4 grid gap-1 border-l border-[var(--color-border)] pl-3">
                  {visibleChildren.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = isCurrentRoute(pathname, child.href);

                    return (
                      <Link
                        aria-current={childActive ? "page" : undefined}
                        className={cn(
                          "inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]",
                          childActive
                            ? "bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
                        )}
                        href={child.href}
                        key={child.href}
                        onClick={onNavigate}
                      >
                        <ChildIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
    </nav>
  );
}

function formatRole(role: UserRole) {
  return role.replaceAll("_", " ").toLowerCase();
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "Admin user";
  const words = source.split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "A";
  const second = words[1]?.[0] ?? words[0]?.[1] ?? "D";

  return `${first}${second}`.toUpperCase();
}

function AdminIdentity({
  collapsed,
  role,
  userEmail,
  userName,
}: {
  collapsed: boolean;
  role: UserRole;
  userEmail?: string | null;
  userName?: string | null;
}) {
  const displayName = userName?.trim() || userEmail || "Sunflour admin";
  const initials = getInitials(userName, userEmail);

  return (
    <div
      className={cn(
        "mt-auto flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3",
        collapsed && "justify-center border-0 bg-transparent p-0",
      )}
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-extrabold text-[var(--color-on-primary)]">
        {initials}
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-bold">{displayName}</p>
          <p className="m-0 mt-1 truncate text-xs capitalize text-[var(--color-text-muted)]">
            {formatRole(role)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function AdminShell({ role, userName, userEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const canCreateProduct = role === "SUPER_ADMIN";

  return (
    <div
      className={cn(
        "min-h-svh bg-[var(--color-canvas)] text-[var(--color-text)] lg:grid",
        collapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[260px_1fr]",
      )}
    >
      <aside className="hidden min-h-svh border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
        <div className="sticky top-0 flex h-svh flex-col gap-4 overflow-y-auto p-4">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
            <Link href="/admin" title="Sunflour Admin">
              <Image
                alt="Sunflour Admin"
                className="rounded-[var(--radius-sm)] object-contain"
                height={collapsed ? 40 : 32}
                src={logoAsset}
                width={collapsed ? 40 : 32}
              />
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
              {userName || userEmail || "Admin"} · {formatRole(role)}
            </p>
          )}
          <AdminNavigation collapsed={collapsed} pathname={pathname} role={role} />
          <AdminIdentity
            collapsed={collapsed}
            role={role}
            userEmail={userEmail}
            userName={userName}
          />
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
            {userName || userEmail || "Admin"} · {formatRole(role)}
          </p>
          <AdminNavigation
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
            pathname={pathname}
            role={role}
          />
          <AdminIdentity
            collapsed={false}
            role={role}
            userEmail={userEmail}
            userName={userName}
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
            <div className="flex shrink-0 items-center gap-2">
              {canCreateProduct ? (
                <Link
                  className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-on-primary)]"
                  href="/admin/products/new"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">New product</span>
                </Link>
              ) : null}
              <Link
                className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-semibold hover:bg-[var(--color-surface-muted)]"
                href="/"
              >
                Public site
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

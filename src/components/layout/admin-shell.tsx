"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileText,
  GalleryHorizontal,
  Images,
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

type StaffRole = Exclude<UserRole, "CUSTOMER">;

interface AdminShellProps {
  role: UserRole;
  userName?: string | null;
  userEmail?: string | null;
  /** The signed-in admin's unfinished product drafts. */
  draftCount?: number;
  children: React.ReactNode;
}

interface AdminNavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  allowedRoles: readonly StaffRole[];
  /** Children are listed only while the parent section is open. */
  children?: AdminNavItem[];
  badge?: "drafts";
}

interface AdminNavSection {
  label: string | null;
  items: AdminNavItem[];
}

const ALL_STAFF = ["ATTENDANT", "MEDIA_MANAGER", "MODERATOR", "SUPER_ADMIN"] as const;
const SUPER = ["SUPER_ADMIN"] as const;

// Grouped by the job an admin is doing, so the list scans in seconds instead
// of reading as one long column of equal-weight links.
export const adminNavSections: AdminNavSection[] = [
  {
    label: null,
    items: [
      { href: "/admin" as Route, label: "Dashboard", icon: LayoutDashboard, allowedRoles: ALL_STAFF },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders" as Route, label: "Orders", icon: ClipboardList, allowedRoles: ["ATTENDANT", "MODERATOR", "SUPER_ADMIN"] },
      { href: "/admin/reviews" as Route, label: "Reviews", icon: MessageSquareText, allowedRoles: ["MODERATOR", "SUPER_ADMIN"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/admin/products" as Route,
        label: "Products",
        icon: Package,
        allowedRoles: ["MEDIA_MANAGER", "MODERATOR", "SUPER_ADMIN"],
      },
      {
        href: "/admin/products/drafts" as Route,
        label: "Drafts",
        icon: FileText,
        allowedRoles: SUPER,
        badge: "drafts",
      },
      { href: "/admin/categories" as Route, label: "Categories", icon: Tags, allowedRoles: SUPER },
    ],
  },
  {
    label: "Storefront",
    items: [
      { href: "/admin/homepage" as Route, label: "Homepage", icon: GalleryHorizontal, allowedRoles: ["MEDIA_MANAGER", "SUPER_ADMIN"] },
      { href: "/admin/menu-boards" as Route, label: "Menu boards", icon: Images, allowedRoles: ["MEDIA_MANAGER", "SUPER_ADMIN"] },
      { href: "/admin/tabular-menu" as Route, label: "Tabular menu", icon: ListOrdered, allowedRoles: ["MEDIA_MANAGER", "SUPER_ADMIN"] },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/delivery" as Route, label: "Delivery", icon: Truck, allowedRoles: SUPER },
      { href: "/admin/users" as Route, label: "Users", icon: UsersRound, allowedRoles: SUPER },
      {
        href: "/admin/settings" as Route,
        label: "Settings",
        icon: Settings,
        allowedRoles: SUPER,
        children: [
          { href: "/admin/settings/business" as Route, label: "Business profile", icon: Building2, allowedRoles: SUPER },
          { href: "/admin/settings/payment" as Route, label: "Payment", icon: CreditCard, allowedRoles: SUPER },
          { href: "/admin/settings/email" as Route, label: "Email", icon: Mail, allowedRoles: SUPER },
          { href: "/admin/settings/contacts" as Route, label: "Contacts", icon: Phone, allowedRoles: SUPER },
        ],
      },
      { href: "/admin/audit-logs" as Route, label: "Audit logs", icon: ShieldCheck, allowedRoles: SUPER },
    ],
  },
];

function canSee(role: UserRole, allowedRoles: readonly StaffRole[]) {
  return allowedRoles.includes(role as StaffRole);
}

function isWithin(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The single nav item that owns the current page: the most specific match
 * wins, so /admin/products/drafts lights up "Drafts", not "Products".
 */
function findActiveHref(pathname: string): string | null {
  let best: string | null = null;

  for (const section of adminNavSections) {
    for (const item of section.items) {
      for (const candidate of [item, ...(item.children ?? [])]) {
        const matches =
          candidate.href === "/admin"
            ? pathname === "/admin"
            : isWithin(pathname, candidate.href);

        if (matches && (!best || candidate.href.length > best.length)) {
          best = candidate.href;
        }
      }
    }
  }

  // The create page belongs to the catalog, not a separate nav entry.
  return pathname === "/admin/products/new" ? "/admin/products" : best;
}

function findPageContext(pathname: string): { section: string | null; page: string } {
  if (pathname === "/admin/products/new") {
    return { section: "Catalog", page: "New product" };
  }

  const activeHref = findActiveHref(pathname);

  for (const section of adminNavSections) {
    for (const item of section.items) {
      for (const candidate of [item, ...(item.children ?? [])]) {
        if (candidate.href === activeHref) {
          return { section: section.label, page: candidate.label };
        }
      }
    }
  }

  return { section: null, page: "Admin" };
}

const navLinkBase =
  "relative inline-flex min-h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]";
// A soft tint with a slim brand bar reads clearly without a block of red on
// every page; solid brand red is kept for primary actions.
const navLinkActive =
  "bg-[color-mix(in_srgb,var(--color-primary)_9%,transparent)] text-[var(--color-primary)] before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--color-primary)]";
const navLinkIdle =
  "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]";

function NavBadge({ value }: { value: number }) {
  return (
    <span className="ml-auto rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--color-text-muted)]">
      {value}
      <span className="sr-only"> unfinished</span>
    </span>
  );
}

function AdminNavigation({
  collapsed,
  pathname,
  role,
  draftCount,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  role: UserRole;
  draftCount: number;
  onNavigate?: () => void;
}) {
  const activeHref = findActiveHref(pathname);

  return (
    <nav className="grid gap-4" aria-label="Admin navigation">
      {adminNavSections.map((section) => {
        const items = section.items.filter((item) => canSee(role, item.allowedRoles));

        if (items.length === 0) {
          return null;
        }

        return (
          <div className="grid gap-0.5" key={section.label ?? "home"}>
            {section.label && !collapsed ? (
              <p className="m-0 px-3 pb-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[var(--color-text-soft)]">
                {section.label}
              </p>
            ) : null}
            {section.label && collapsed ? (
              <hr className="mx-3 my-1 border-[var(--color-border)]" />
            ) : null}
            {items.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeHref;
              const sectionOpen = isWithin(pathname, item.href);
              const visibleChildren = item.children?.filter((child) =>
                canSee(role, child.allowedRoles),
              );
              const badgeValue = item.badge === "drafts" ? draftCount : 0;

              return (
                <div className="grid gap-0.5" key={item.href}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      navLinkBase,
                      active ? navLinkActive : navLinkIdle,
                      collapsed && "justify-center px-0",
                    )}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden="true" />
                    <span className={collapsed ? "sr-only" : undefined}>{item.label}</span>
                    {!collapsed && badgeValue > 0 ? <NavBadge value={badgeValue} /> : null}
                  </Link>
                  {!collapsed && sectionOpen && visibleChildren?.length ? (
                    <div className="ml-5 grid gap-0.5 border-l border-[var(--color-border)] pl-2">
                      {visibleChildren.map((child) => {
                        const childActive = child.href === activeHref;

                        return (
                          <Link
                            aria-current={childActive ? "page" : undefined}
                            className={cn(
                              navLinkBase,
                              "min-h-9 font-medium",
                              childActive ? navLinkActive : navLinkIdle,
                            )}
                            href={child.href}
                            key={child.href}
                            onClick={onNavigate}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
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
        "mt-auto flex items-center gap-3 border-t border-[var(--color-border)] pt-4",
        collapsed && "justify-center",
      )}
      title={collapsed ? `${displayName} · ${formatRole(role)}` : undefined}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-surface-muted)] text-xs font-extrabold text-[var(--color-text)]">
        {initials}
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-bold">{displayName}</p>
          <p className="m-0 truncate text-xs capitalize text-[var(--color-text-muted)]">
            {formatRole(role)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function AdminShell({
  role,
  userName,
  userEmail,
  draftCount = 0,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const canCreateProduct = role === "SUPER_ADMIN";
  const context = findPageContext(pathname);
  const onCreatePage = pathname === "/admin/products/new";

  return (
    <div
      className={cn(
        "min-h-svh bg-[var(--color-canvas)] text-[var(--color-text)] lg:grid",
        collapsed ? "lg:grid-cols-[76px_1fr]" : "lg:grid-cols-[240px_1fr]",
      )}
    >
      <aside className="hidden min-h-svh border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
        <div className="sticky top-0 flex h-svh flex-col gap-5 overflow-y-auto px-3 py-4">
          <div className={cn("flex items-center", collapsed ? "flex-col gap-3" : "justify-between gap-2 px-1")}>
            <Link className="flex items-center gap-2" href="/admin" title="Sunflour Admin">
              <Image
                alt=""
                className="rounded-[var(--radius-sm)] object-contain"
                height={32}
                src={logoAsset}
                width={32}
              />
              <span className={collapsed ? "sr-only" : "text-sm font-extrabold"}>
                Sunflour Admin
              </span>
            </Link>
            <IconButton
              className="h-9 w-9"
              icon={
                collapsed ? (
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                )
              }
              label={collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
              onClick={() => setCollapsed((value) => !value)}
            />
          </div>
          <AdminNavigation
            collapsed={collapsed}
            draftCount={draftCount}
            pathname={pathname}
            role={role}
          />
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
        panelClassName="max-w-xs"
        title="Sunflour Admin"
      >
        <div className="flex min-h-full flex-col gap-5">
          <AdminNavigation
            collapsed={false}
            draftCount={draftCount}
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
        <header className="sticky top-0 z-[var(--layer-header)] border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 backdrop-blur">
          <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <IconButton
                className="h-10 w-10 shrink-0 lg:hidden"
                icon={<Menu className="h-5 w-5" aria-hidden="true" />}
                label="Open admin navigation"
                onClick={() => setMobileOpen(true)}
              />
              <p className="m-0 flex min-w-0 items-center gap-1.5 truncate text-sm">
                {context.section ? (
                  <>
                    <span className="hidden text-[var(--color-text-muted)] sm:inline">
                      {context.section}
                    </span>
                    <span aria-hidden="true" className="hidden text-[var(--color-text-soft)] sm:inline">
                      /
                    </span>
                  </>
                ) : null}
                <span className="truncate font-bold">{context.page}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {canCreateProduct && !onCreatePage ? (
                <Link
                  className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
                  href="/admin/products/new"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">New product</span>
                  <span className="sr-only sm:hidden">New product</span>
                </Link>
              ) : null}
              <Link
                className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                href="/"
                rel="noopener"
                target="_blank"
              >
                <span className="hidden sm:inline">View site</span>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">(opens public site in a new tab)</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

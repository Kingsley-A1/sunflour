"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { CreditCard, Home, ShoppingCart, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCart } from "@/features/cart/cart-store";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  showCount?: boolean;
}

const bottomNavItems: BottomNavItem[] = [
  { href: "/" as Route, label: "Home", icon: Home },
  { href: "/menu" as Route, label: "Menu", icon: Utensils },
  { href: "/cart" as Route, label: "Cart", icon: ShoppingCart, showCount: true },
  { href: "/checkout" as Route, label: "Checkout", icon: CreditCard },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  return (
    <>
      {/* Spacer so page content is never hidden behind the fixed nav. */}
      <div
        aria-hidden="true"
        className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden"
      />
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-[var(--layer-header)] border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="m-0 grid list-none grid-cols-4 gap-0 p-0">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            const showBadge = item.showCount && itemCount > 0;

            return (
              <li key={item.href}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-semibold transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]",
                    active
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-text-muted)]",
                  )}
                  href={item.href}
                >
                  <span className="relative inline-flex">
                    <Icon
                      className={cn("h-6 w-6", active && "stroke-[2.4]")}
                      aria-hidden="true"
                    />
                    {showBadge ? (
                      <span className="absolute -right-2 -top-1.5 inline-flex min-w-4 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-1 text-[0.625rem] font-bold leading-4 text-[var(--color-on-primary)]">
                        {itemCount > 99 ? "99+" : itemCount}
                      </span>
                    ) : null}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

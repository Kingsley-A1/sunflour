"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ClipboardList,
  CreditCard,
  FileText,
  Info,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Phone,
  ShoppingCart,
  UserRound,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";

interface PublicMobileNavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
}

export const publicMobileNavItems: PublicMobileNavItem[] = [
  { href: "/menu" as Route, label: "Menu", icon: Utensils },
  { href: "/cart" as Route, label: "Cart", icon: ShoppingCart },
  { href: "/checkout" as Route, label: "Checkout", icon: CreditCard },
  { href: "/account" as Route, label: "Account", icon: UserRound },
  { href: "/account/orders" as Route, label: "Orders", icon: ClipboardList },
  { href: "/reviews" as Route, label: "Reviews", icon: MessageSquareText },
  { href: "/about" as Route, label: "About", icon: Info },
  { href: "/contact" as Route, label: "Contact", icon: Phone },
  { href: "/privacy" as Route, label: "Privacy", icon: LockKeyhole },
  { href: "/terms" as Route, label: "Terms", icon: FileText },
];

export function PublicMobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        className="md:hidden"
        icon={<Menu className="h-5 w-5" aria-hidden="true" />}
        label="Open navigation menu"
        onClick={() => setOpen(true)}
      />
      <Sheet
        onClose={() => setOpen(false)}
        open={open}
        title="Sunflour navigation"
      >
        <nav aria-label="Mobile public page navigation">
          <ul className="m-0 grid list-none gap-2 p-0">
            {publicMobileNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    className="flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]"
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 text-[var(--color-primary)]"
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </Sheet>
    </>
  );
}

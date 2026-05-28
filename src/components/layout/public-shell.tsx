import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ShoppingBag, UserRound } from "lucide-react";
import logoAsset from "../../../logo.png";
import { CartProvider } from "@/features/cart/cart-store";
import { StickyCartBar } from "@/components/commerce/sticky-cart-bar";
import { Footer } from "@/components/layout/footer";

interface PublicShellProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/" as Route, label: "Home" },
  { href: "/menu" as Route, label: "Menu" },
  { href: "/about" as Route, label: "About" },
  { href: "/contact" as Route, label: "Contact" },
  { href: "/reviews" as Route, label: "Reviews" },
];

export function PublicShell({ children }: PublicShellProps) {
  return (
    <CartProvider>
      <div className="min-h-svh bg-[var(--color-bg)] text-[var(--color-text)]">
        <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/92 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <Link className="flex min-w-0 items-center gap-3" href="/">
              <Image
                alt="Sunflour Bakery logo"
                className="h-11 w-11 rounded-[var(--radius-sm)] object-contain"
                height={44}
                priority
                src={logoAsset}
                width={44}
              />
              <span className="min-w-0 text-base font-extrabold leading-tight">
                Sunflour Bakery
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">
              {navItems.map((item) => (
                <Link
                  className="min-h-11 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link
                className="hidden min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold sm:inline-flex"
                href="/account"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Account
              </Link>
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-on-primary)]"
                href="/cart"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Cart
              </Link>
            </div>
          </div>
          <nav
            aria-label="Mobile public navigation"
            className="flex gap-1 overflow-x-auto border-t border-[var(--color-border)] px-4 py-2 md:hidden"
          >
            {navItems.map((item) => (
              <Link
                className="min-h-10 shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
            <Link
              className="min-h-10 shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)]"
              href="/account"
            >
              Account
            </Link>
          </nav>
        </header>
        {children}
        <Footer />
        <StickyCartBar />
      </div>
    </CartProvider>
  );
}

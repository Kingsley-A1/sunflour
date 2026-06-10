import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ShoppingBag, UserRound } from "lucide-react";
import logoAsset from "../../../logo.png";
import { CartProvider } from "@/features/cart/cart-store";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StickyCartBar } from "@/components/commerce/sticky-cart-bar";
import { Footer } from "@/components/layout/footer";
import { PublicMobileNavigation } from "@/components/layout/public-mobile-navigation";
import type { PublicCategoryNavigationItem } from "@/types/domain";

interface PublicShellProps {
  categories: PublicCategoryNavigationItem[];
  children: React.ReactNode;
  isSignedIn: boolean;
}

const navItems = [
  { href: "/" as Route, label: "Home" },
  { href: "/menu" as Route, label: "Menu" },
  { href: "/about" as Route, label: "About" },
  { href: "/contact" as Route, label: "Contact" },
  { href: "/reviews" as Route, label: "Reviews" },
];

export function PublicShell({
  categories,
  children,
  isSignedIn,
}: PublicShellProps) {
  const categoryLinks =
    categories.length > 0
      ? categories
      : [{ id: "menu", name: "Menu", slug: "" }];

  return (
    <CartProvider>
      <div className="min-h-svh bg-[var(--color-bg)] text-[var(--color-text)]">
        <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/92 backdrop-blur">
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
              {isSignedIn ? (
                <SignOutButton className="hidden md:inline-flex" />
              ) : null}
              <Link
                aria-label="Review cart"
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text)] transition duration-[var(--motion-normal)] ease-[var(--ease-standard)] hover:bg-[var(--color-surface-soft)]"
                href="/cart"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Cart</span>
              </Link>
              <PublicMobileNavigation isSignedIn={isSignedIn} />
            </div>
          </div>
          <nav
            aria-label="Product categories"
            className="flex gap-1 overflow-x-auto border-t border-[var(--color-border)] px-4 py-2 md:hidden"
          >
            {categoryLinks.map((category) => (
              <Link
                className="min-h-11 shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)]"
                href={
                  category.slug
                    ? (`/menu?category=${category.slug}` as Route)
                    : ("/menu" as Route)
                }
                key={category.id}
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </header>
        {children}
        <Footer />
        <StickyCartBar />
      </div>
    </CartProvider>
  );
}

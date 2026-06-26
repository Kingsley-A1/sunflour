import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { CreditCard, ShoppingBag, UserPlus, UserRound } from "lucide-react";
import logoAsset from "../../../logo.png";
import { CartProvider } from "@/features/cart/cart-store";
import { StickyCartBar } from "@/components/commerce/sticky-cart-bar";
import { Footer } from "@/components/layout/footer";
import { HeaderSearch } from "@/components/layout/header-search";
import { PublicMobileNavigation } from "@/components/layout/public-mobile-navigation";
import { PublicWhatsAppFab } from "@/components/layout/public-whatsapp-fab";
import { getPublicContactConfig } from "@/server/config/public-contact";
import type { PublicMenuCategoryNavItem } from "@/types/domain";

interface PublicShellProps {
  categories: PublicMenuCategoryNavItem[];
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

export async function PublicShell({
  categories,
  children,
  isSignedIn,
}: PublicShellProps) {
  const contact = await getPublicContactConfig();
  const categoryLinks =
    categories.length > 0 ? categories : [{ id: "", label: "Menu" }];

  return (
    <CartProvider>
      <div className="flex min-h-svh flex-col bg-[var(--color-canvas)] text-[var(--color-text)]">
        <header className="sticky top-0 z-[var(--layer-header)] border-b border-[var(--color-border)] bg-[var(--color-surface)]/92 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <Link className="flex min-w-0 items-center gap-3" href="/">
              <Image
                alt={`${contact.businessName} logo`}
                className="h-11 w-11 rounded-[var(--radius-sm)] object-contain"
                height={44}
                priority
                src={logoAsset}
                width={44}
              />
              <span className="min-w-0 text-base font-extrabold leading-tight">
                {contact.businessName}
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">
              {navItems.map((item) => (
                <Link
                  className="min-h-11 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <HeaderSearch />
              {isSignedIn ? (
                <Link
                  className="hidden min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold sm:inline-flex"
                  href="/account"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Account
                </Link>
              ) : (
                <div className="hidden items-center gap-2 md:flex">
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold"
                    href="/sign-in"
                  >
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                    Sign in
                  </Link>
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold"
                    href="/register"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Register
                  </Link>
                </div>
              )}
              <Link
                className="hidden min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-on-primary)] md:inline-flex"
                href="/checkout"
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Checkout
              </Link>
              <Link
                aria-label="Review cart"
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:bg-[var(--color-surface-muted)]"
                href="/cart"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Cart</span>
              </Link>
              <PublicMobileNavigation isSignedIn={isSignedIn} />
            </div>
          </div>
          <nav
            aria-label="Menu categories"
            className="flex gap-1 overflow-x-auto border-t border-[var(--color-border)] px-4 py-2 md:hidden"
          >
            {categoryLinks.map((category) => (
              <Link
                className="min-h-11 shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)]"
                href={
                  (category.id
                    ? `/menu?view=table&category=${encodeURIComponent(category.id)}`
                    : "/menu") as Route
                }
                key={category.id || "menu"}
              >
                {category.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="flex-grow">{children}</div>
        <Footer />
        <PublicWhatsAppFab
          businessName={contact.businessName}
          href={contact.whatsappHref}
        />
        <StickyCartBar />
      </div>
    </CartProvider>
  );
}

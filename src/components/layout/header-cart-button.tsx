"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/features/cart/cart-store";

/** Header cart link with a live item count, the standard ordering entry point. */
export function HeaderCartButton() {
  const { itemCount } = useCart();
  const label = itemCount > 0 ? `Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}` : "Cart";

  return (
    <Link
      aria-label={label}
      className="relative hidden min-h-11 items-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-hover)] md:inline-flex"
      href="/cart"
    >
      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
      Cart
      {itemCount > 0 ? (
        <span
          aria-hidden="true"
          className="grid min-w-5 place-items-center rounded-full bg-[var(--color-accent)] px-1.5 text-xs font-extrabold tabular-nums text-[var(--color-on-accent)]"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}

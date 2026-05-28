"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { PriceText } from "@/components/ui/price-text";
import { useCart } from "@/features/cart/cart-store";

export function StickyCartBar() {
  const { itemCount, displaySubtotal } = useCart();

  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 shadow-[var(--shadow-card)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-xs text-[var(--color-text-muted)]">
            {itemCount} item{itemCount === 1 ? "" : "s"} in cart
          </p>
          <PriceText amount={displaySubtotal} />
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
          href="/cart"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          View cart
        </Link>
      </div>
    </div>
  );
}

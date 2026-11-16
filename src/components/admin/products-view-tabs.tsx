import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";

interface ProductsViewTabsProps {
  active: "products" | "drafts";
  productCount: number;
  draftCount: number;
}

function tabClass(active: boolean): string {
  return cn(
    "inline-flex min-h-10 shrink-0 items-center gap-2 border-b-2 px-1 text-sm font-semibold transition duration-[var(--motion-duration-fast)]",
    active
      ? "border-[var(--color-primary)] text-[var(--color-text)]"
      : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
  );
}

function Count({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      className={cn(
        "rounded-[var(--radius-pill)] px-2 py-0.5 text-xs tabular-nums",
        active
          ? "bg-[var(--color-accent-soft)] text-[var(--color-text)]"
          : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
      )}
    >
      {value}
    </span>
  );
}

export function ProductsViewTabs({ active, productCount, draftCount }: ProductsViewTabsProps) {
  return (
    <nav
      aria-label="Product views"
      className="flex gap-6 overflow-x-auto border-b border-[var(--color-border)]"
    >
      <Link
        aria-current={active === "products" ? "page" : undefined}
        className={tabClass(active === "products")}
        href={"/admin/products" as Route}
      >
        Products <Count active={active === "products"} value={productCount} />
      </Link>
      <Link
        aria-current={active === "drafts" ? "page" : undefined}
        className={tabClass(active === "drafts")}
        href={"/admin/products/drafts" as Route}
      >
        Drafts <Count active={active === "drafts"} value={draftCount} />
      </Link>
    </nav>
  );
}

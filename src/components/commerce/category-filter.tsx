"use client";

import { cn } from "@/lib/utils";
import type { PublicCategory } from "@/types/domain";

interface CategoryFilterProps {
  categories: PublicCategory[];
  activeSlug: string;
  onChange: (slug: string) => void;
}

export function CategoryFilter({
  categories,
  activeSlug,
  onChange,
}: CategoryFilterProps) {
  const totalProducts = categories.reduce(
    (count, category) => count + category.products.length,
    0,
  );

  return (
    <nav
      aria-label="Menu categories"
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-raised)]"
    >
      <div className="flex gap-1 overflow-x-auto" role="list">
      <button
        aria-current={activeSlug === "all" ? "page" : undefined}
        className={cn(
          "grid min-h-12 shrink-0 place-items-center rounded-[var(--radius-sm)] px-4 text-left text-sm font-semibold transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
          activeSlug === "all"
            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
            : "text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
        )}
        onClick={() => onChange("all")}
        style={activeSlug === "all" ? { color: "var(--color-on-primary)" } : undefined}
        type="button"
      >
        <span>All</span>
        <span className="text-xs font-medium opacity-80">{totalProducts}</span>
      </button>
      {categories.map((category) => (
        <button
          aria-current={activeSlug === category.slug ? "page" : undefined}
          className={cn(
            "grid min-h-12 shrink-0 place-items-center rounded-[var(--radius-sm)] px-4 text-left text-sm font-semibold transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
            activeSlug === category.slug
              ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
              : "text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
          )}
          key={category.id}
          onClick={() => onChange(category.slug)}
          style={
            activeSlug === category.slug
              ? { color: "var(--color-on-primary)" }
              : undefined
          }
          type="button"
        >
          <span>{category.name}</span>
          <span className="text-xs font-medium opacity-80">
            {category.products.length}
          </span>
        </button>
      ))}
      </div>
    </nav>
  );
}

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
  return (
    <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Menu categories">
      <button
        aria-pressed={activeSlug === "all"}
        className={cn(
          "min-h-11 shrink-0 rounded-[var(--radius-pill)] border px-4 text-sm font-semibold transition duration-[var(--motion-normal)] ease-[var(--ease-standard)]",
          activeSlug === "all"
            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]",
        )}
        onClick={() => onChange("all")}
        type="button"
      >
        All
      </button>
      {categories.map((category) => (
        <button
          aria-pressed={activeSlug === category.slug}
          className={cn(
            "min-h-11 shrink-0 rounded-[var(--radius-pill)] border px-4 text-sm font-semibold transition duration-[var(--motion-normal)] ease-[var(--ease-standard)]",
            activeSlug === category.slug
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]",
          )}
          key={category.id}
          onClick={() => onChange(category.slug)}
          type="button"
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

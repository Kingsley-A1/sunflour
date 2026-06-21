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
          "min-h-11 shrink-0 rounded-[var(--radius-pill)] border px-4 text-sm font-semibold transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]",
          activeSlug === "all"
            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
        )}
        onClick={() => onChange("all")}
        style={activeSlug === "all" ? { color: "var(--color-on-primary)" } : undefined}
        type="button"
      >
        All
      </button>
      {categories.map((category) => (
        <button
          aria-pressed={activeSlug === category.slug}
          className={cn(
            "min-h-11 shrink-0 rounded-[var(--radius-pill)] border px-4 text-sm font-semibold transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]",
            activeSlug === category.slug
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
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
          {category.name}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/commerce/product-grid";
import { SearchBar } from "@/components/commerce/search-bar";
import type { PublicMenuResponse } from "@/types/domain";

interface MenuBrowserProps {
  menu: PublicMenuResponse;
  initialQuery?: string;
  initialCategorySlug?: string;
}

export function MenuBrowser({
  menu,
  initialQuery = "",
  initialCategorySlug = "",
}: MenuBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const hasInitialCategory = menu.categories.some(
    (category) => category.slug === initialCategorySlug,
  );
  const [activeCategory, setActiveCategory] = useState(
    hasInitialCategory ? initialCategorySlug : "all",
  );

  const allProducts = useMemo(
    () => menu.categories.flatMap((category) => category.products),
    [menu.categories],
  );

  const suggestions = useMemo(
    () => allProducts.map((product) => product.name),
    [allProducts],
  );

  const products = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const base =
      activeCategory === "all"
        ? allProducts
        : menu.categories.find((category) => category.slug === activeCategory)
            ?.products ?? allProducts;

    if (!normalizedQuery) {
      return base;
    }

    return base.filter((product) =>
      [product.name, product.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [activeCategory, allProducts, menu.categories, query]);

  return (
    <section className="grid gap-5" aria-label="Menu browser">
      {menu.categories.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by category">
          <CategoryPill
            active={activeCategory === "all"}
            label="All"
            onClick={() => setActiveCategory("all")}
          />
          {menu.categories.map((category) => (
            <CategoryPill
              active={activeCategory === category.slug}
              key={category.id}
              label={category.name}
              onClick={() => setActiveCategory(category.slug)}
            />
          ))}
        </div>
      ) : null}
      <SearchBar onChange={setQuery} suggestions={suggestions} value={query} />
      <ProductGrid products={products} />
    </section>
  );
}

function CategoryPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={
        active
          ? "min-h-10 shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
          : "min-h-10 shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
      }
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

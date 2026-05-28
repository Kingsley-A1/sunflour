"use client";

import { useMemo, useState } from "react";
import { CategoryFilter } from "@/components/commerce/category-filter";
import { ProductGrid } from "@/components/commerce/product-grid";
import { SearchBar } from "@/components/commerce/search-bar";
import type { PublicMenuResponse } from "@/types/domain";

interface MenuBrowserProps {
  menu: PublicMenuResponse;
}

export function MenuBrowser({ menu }: MenuBrowserProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");

  const products = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedCategories =
      activeCategory === "all"
        ? menu.categories
        : menu.categories.filter((category) => category.slug === activeCategory);

    return selectedCategories
      .flatMap((category) => category.products)
      .filter((product) => {
        if (!normalizedQuery) {
          return true;
        }

        return [product.name, product.description ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      });
  }, [activeCategory, menu.categories, query]);

  return (
    <section className="grid gap-5" aria-label="Menu browser">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <CategoryFilter
          activeSlug={activeCategory}
          categories={menu.categories}
          onChange={setActiveCategory}
        />
        <SearchBar onChange={setQuery} value={query} />
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CategoryFilter } from "@/components/commerce/category-filter";
import { ProductGrid } from "@/components/commerce/product-grid";
import { SearchBar } from "@/components/commerce/search-bar";
import type { PublicMenuResponse } from "@/types/domain";

interface MenuBrowserProps {
  menu: PublicMenuResponse;
}

export function MenuBrowser({ menu }: MenuBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const validCategorySlugs = useMemo(
    () => new Set(menu.categories.map((category) => category.slug)),
    [menu.categories],
  );
  const categoryFromUrl = searchParams.get("category");
  const initialCategory =
    categoryFromUrl && validCategorySlugs.has(categoryFromUrl)
      ? categoryFromUrl
      : "all";
  const activeCategory = initialCategory;
  const [query, setQuery] = useState("");

  function updateActiveCategory(nextCategory: string) {
    const nextActiveCategory = validCategorySlugs.has(nextCategory)
      ? nextCategory
      : "all";
    const params = new URLSearchParams(searchParams.toString());

    if (nextActiveCategory === "all") {
      params.delete("category");
    } else {
      params.set("category", nextActiveCategory);
    }

    const nextHref = (
      params.toString() ? `${pathname}?${params.toString()}` : pathname
    ) as Route;

    router.replace(nextHref, { scroll: false });
  }

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
          onChange={updateActiveCategory}
        />
        <SearchBar onChange={setQuery} value={query} />
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/commerce/product-grid";
import { SearchBar } from "@/components/commerce/search-bar";
import type { PublicMenuResponse } from "@/types/domain";

interface MenuBrowserProps {
  menu: PublicMenuResponse;
  initialQuery?: string;
}

export function MenuBrowser({ menu, initialQuery = "" }: MenuBrowserProps) {
  const [query, setQuery] = useState(initialQuery);

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

    return allProducts.filter((product) => {
      if (!normalizedQuery) return true;

      return [product.name, product.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [allProducts, query]);

  return (
    <section className="grid gap-5" aria-label="Menu browser">
      <SearchBar onChange={setQuery} suggestions={suggestions} value={query} />
      <ProductGrid products={products} />
    </section>
  );
}

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

  const products = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return menu.categories
      .flatMap((category) => category.products)
      .filter((product) => {
        if (!normalizedQuery) return true;

        return [product.name, product.description ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      });
  }, [menu.categories, query]);

  return (
    <section className="grid gap-5" aria-label="Menu browser">
      <SearchBar onChange={setQuery} value={query} />
      <ProductGrid products={products} />
    </section>
  );
}

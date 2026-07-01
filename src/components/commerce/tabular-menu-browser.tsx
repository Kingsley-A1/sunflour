"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { SearchBar } from "@/components/commerce/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceText } from "@/components/ui/price-text";
import { SafeImage } from "@/components/ui/safe-image";
import { Sheet } from "@/components/ui/sheet";
import type {
  PublicProduct,
  TabularMenuCategory,
  TabularMenuContent,
  TabularMenuItem,
} from "@/types/domain";
import { formatNairaFromKobo } from "@/lib/formatters";

interface TabularMenuBrowserProps {
  checkoutHref: Route;
  content: TabularMenuContent;
  products?: PublicProduct[];
  initialCategoryId?: string;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function TabularMenuBrowser({
  checkoutHref,
  content,
  products = [],
  initialCategoryId = "all",
}: TabularMenuBrowserProps) {
  const [activeCategoryId, setActiveCategoryId] =
    useState<string>(initialCategoryId);
  const [query, setQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(content.categories.map((category) => [category.id, category])),
    [content.categories],
  );

  const productBySlug = useMemo(
    () => new Map(products.map((product) => [product.slug, product])),
    [products],
  );
  const productByName = useMemo(
    () => new Map(products.map((product) => [normalizeName(product.name), product])),
    [products],
  );

  function findProduct(item: TabularMenuItem): PublicProduct | null {
    return (
      productBySlug.get(item.id) ??
      productBySlug.get(slugify(item.name)) ??
      productByName.get(normalizeName(item.name)) ??
      null
    );
  }

  const itemNames = useMemo(
    () => content.items.map((item) => item.name),
    [content.items],
  );

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const byCategory =
      activeCategoryId === "all"
        ? content.items
        : content.items.filter((item) => item.categoryId === activeCategoryId);

    if (!normalizedQuery) {
      return byCategory;
    }

    return byCategory.filter((item) => {
      const categoryLabel = categoryMap.get(item.categoryId)?.label ?? "";
      return [
        item.name,
        item.description,
        item.details,
        categoryLabel,
        ...item.tags,
        ...item.ingredients,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeCategoryId, categoryMap, content.items, query]);

  const selectedItem =
    content.items.find((item) => item.id === selectedItemId) ?? null;

  return (
    <section className="grid gap-4" aria-label="Tabular menu">
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by category">
        <CategoryPill
          active={activeCategoryId === "all"}
          label="All"
          onClick={() => setActiveCategoryId("all")}
        />
        {content.categories.map((category) => (
          <CategoryPill
            active={activeCategoryId === category.id}
            key={category.id}
            label={category.label}
            onClick={() => setActiveCategoryId(category.id)}
          />
        ))}
      </div>

      <SearchBar
        label="Search menu"
        onChange={setQuery}
        placeholder="Cake, burger, pizza..."
        showLabel={false}
        suggestions={itemNames}
        value={query}
      />

      {visibleItems.length === 0 ? (
        <EmptyState
          description="Try another product name or category."
          title="No matching items"
        />
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {visibleItems.map((item) => (
            <li key={item.id}>
              <button
                className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                onClick={() => setSelectedItemId(item.id)}
                type="button"
              >
                <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]">
                  <SafeImage
                    alt={item.imageAlt}
                    className="object-cover"
                    fallback={
                      <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--color-text-muted)]">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    }
                    fill
                    loading="lazy"
                    sizes="56px"
                    src={item.imageUrl}
                    unoptimized
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold sm:text-base">
                    {item.name}
                  </span>
                  {item.description ? (
                    <span className="mt-0.5 block truncate text-xs text-[var(--color-text-muted)] sm:text-sm">
                      {item.description}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-sm font-bold text-[var(--color-primary)]">
                  {rowPriceSummary(item)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        onClose={() => setSelectedItemId(null)}
        open={Boolean(selectedItem)}
        panelClassName="max-w-2xl"
        title={selectedItem?.name ?? "Menu item"}
      >
        {selectedItem ? (
          <TabularMenuItemDetails
            category={categoryMap.get(selectedItem.categoryId) ?? null}
            checkoutHref={checkoutHref}
            item={selectedItem}
            product={findProduct(selectedItem)}
          />
        ) : null}
      </Sheet>
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

function TabularMenuItemDetails({
  category,
  checkoutHref,
  item,
  product,
}: {
  category: TabularMenuCategory | null;
  checkoutHref: Route;
  item: TabularMenuItem;
  product: PublicProduct | null;
}) {
  return (
    <div className="grid gap-5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-canvas-muted)]">
        <SafeImage
          alt={item.imageAlt}
          className="object-cover"
          fallback={
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
              {item.name}
            </div>
          }
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          src={item.imageUrl}
          unoptimized
        />
      </div>

      {category || item.tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {category ? (
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--color-text)]">
              {category.label}
            </span>
          ) : null}
          {item.tags.map((tag) => (
            <span
              className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {item.details ? (
        <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
          {item.details}
        </p>
      ) : null}

      <div className="grid gap-2">
        {item.prices.map((price) => (
          <div
            className="flex items-center justify-between gap-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2"
            key={price.id}
          >
            <span className="text-sm font-medium text-[var(--color-text-muted)]">
              {price.label ?? "Order"}
            </span>
            <PriceText amount={price.amount} />
          </div>
        ))}
      </div>

      {item.ingredients.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {item.ingredients.map((ingredient) => (
            <span
              className="rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
              key={ingredient}
            >
              {ingredient}
            </span>
          ))}
        </div>
      ) : null}

      {product ? (
        <AddToCartButton className="w-full" product={product} />
      ) : (
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          href={checkoutHref}
        >
          Go to checkout
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function rowPriceSummary(item: TabularMenuItem): string {
  const first = item.prices[0]?.amount ?? 0;
  return item.prices.length > 1
    ? `${formatNairaFromKobo(first)}+`
    : formatNairaFromKobo(first);
}

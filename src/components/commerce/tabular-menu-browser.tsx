"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Info,
  ListOrdered,
  Tags,
} from "lucide-react";
import { SearchBar } from "@/components/commerce/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceText } from "@/components/ui/price-text";
import { SafeImage } from "@/components/ui/safe-image";
import { Sheet } from "@/components/ui/sheet";
import type {
  TabularMenuCategory,
  TabularMenuContent,
  TabularMenuItem,
} from "@/types/domain";
import { formatNairaFromKobo } from "@/lib/formatters";

interface TabularMenuBrowserProps {
  checkoutHref: Route;
  content: TabularMenuContent;
}

export function TabularMenuBrowser({
  checkoutHref,
  content,
}: TabularMenuBrowserProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(content.categories.map((category) => [category.id, category])),
    [content.categories],
  );

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const categoryFilteredItems =
      activeCategoryId === "all"
        ? content.items
        : content.items.filter((item) => item.categoryId === activeCategoryId);

    if (!normalizedQuery) {
      return categoryFilteredItems;
    }

    return categoryFilteredItems.filter((item) => {
      const categoryLabel = categoryMap.get(item.categoryId)?.label ?? "";
      const searchableText = [
        item.name,
        item.description,
        item.details,
        categoryLabel,
        ...item.tags,
        ...item.ingredients,
        ...item.prices.flatMap((price) => [
          price.label ?? "",
          formatNairaFromKobo(price.amount),
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [activeCategoryId, categoryMap, content.items, query]);

  const selectedItem =
    visibleItems.find((item) => item.id === selectedItemId) ??
    content.items.find((item) => item.id === selectedItemId) ??
    null;

  return (
    <section className="grid gap-6" aria-label="Tabular menu browser">
      <div className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)] lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-start">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Tabular menu
            </p>
            <h2 className="m-0 text-2xl font-extrabold sm:text-3xl">
              Quick-reference names and prices
            </h2>
            <p className="m-0 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
              Use this view to scan the broader Sunflour menu quickly. For live
              cart actions and trusted order flow, use the Products tab before
              checkout.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryStat
              icon={<Tags className="h-4 w-4" aria-hidden="true" />}
              label="Categories"
              value={String(content.categories.length)}
            />
            <SummaryStat
              icon={<ListOrdered className="h-4 w-4" aria-hidden="true" />}
              label="Menu items"
              value={String(content.items.length)}
            />
            <SummaryStat
              icon={<Info className="h-4 w-4" aria-hidden="true" />}
              label="Visible now"
              value={String(visibleItems.length)}
            />
          </div>
        </div>

        <aside className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
          <p className="m-0 text-sm font-bold text-[var(--color-text)]">
            Ordering note
          </p>
          <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
            The tabular menu is a reference surface. Checkout uses live catalog
            items, backend-verified totals, and current delivery rules.
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            href={checkoutHref}
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span>Go to checkout</span>
          </Link>
        </aside>
      </div>

      <div className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="flex gap-2 overflow-x-auto pb-1">
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
            label="Search tabular menu"
            onChange={setQuery}
            placeholder="Cake, burger, pizza..."
            value={query}
          />
        </div>

        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-canvas-muted)] px-4 py-3">
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                Price list
              </p>
              <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
                Tap any row for details.
              </p>
            </div>
            <p className="m-0 text-sm font-semibold text-[var(--color-text-muted)]">
              {visibleItems.length} item{visibleItems.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-left">
              <caption className="sr-only">
                Sunflour Bakery tabular menu items and prices
              </caption>
              <thead className="bg-[var(--color-surface)]">
                <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  <th className="px-4 py-3 font-bold" scope="col">
                    Product
                  </th>
                  <th className="px-4 py-3 font-bold" scope="col">
                    Category
                  </th>
                  <th className="px-4 py-3 font-bold text-right" scope="col">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {visibleItems.map((item) => (
                  <tr
                    className="transition hover:bg-[var(--color-canvas-muted)]"
                    key={item.id}
                  >
                    <th className="p-0" scope="row">
                      <button
                        className="min-h-14 w-full px-4 py-3 text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
                        onClick={() => setSelectedItemId(item.id)}
                        type="button"
                      >
                        <span className="block text-sm font-bold text-[var(--color-text)] sm:text-base">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                          {item.description}
                        </span>
                      </button>
                    </th>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {categoryMap.get(item.categoryId)?.label ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-[var(--color-primary)]">
                      {formatPriceSummary(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visibleItems.length === 0 ? (
              <div className="border-t border-[var(--color-border)] p-6">
                <EmptyState
                  description="Try another product name, category, or ingredient."
                  title="No matching menu items"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="grid gap-4">
        <div className="grid gap-1">
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
            Menu cards
          </p>
          <h3 className="m-0 text-xl font-bold">Browse the same list visually</h3>
        </div>

        {visibleItems.length === 0 ? null : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <MenuCard
                category={categoryMap.get(item.categoryId) ?? null}
                item={item}
                key={item.id}
                onSelect={() => setSelectedItemId(item.id)}
              />
            ))}
          </div>
        )}
      </section>

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
          />
        ) : null}
      </Sheet>
    </section>
  );
}

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <div className="flex items-center gap-2 text-[var(--color-primary)]">
        {icon}
        <p className="m-0 text-sm font-semibold text-[var(--color-text)]">
          {label}
        </p>
      </div>
      <p className="m-0 mt-3 text-2xl font-extrabold">{value}</p>
    </article>
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
          ? "min-h-11 shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
          : "min-h-11 shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
      }
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function MenuCard({
  category,
  item,
  onSelect,
}: {
  category: TabularMenuCategory | null;
  item: TabularMenuItem;
  onSelect: () => void;
}) {
  return (
    <button
      aria-label={`View ${item.name} details`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-left shadow-[var(--shadow-raised)] transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-floating)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
      onClick={onSelect}
      type="button"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-canvas-muted)]">
        <SafeImage
          alt={item.imageAlt}
          className="object-cover transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] group-hover:scale-[1.02]"
          fallback={
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
              {item.name}
            </div>
          }
          fill
          loading="lazy"
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          src={item.imageUrl}
          unoptimized
        />
      </div>
      <div className="grid flex-1 gap-3 p-4">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {category ? (
              <span className="rounded-[var(--radius-pill)] bg-[var(--color-accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--color-text)]">
                {category.label}
              </span>
            ) : null}
            {item.tags.slice(0, 2).map((tag) => (
              <span
                className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)]"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
          <h4 className="m-0 text-lg font-bold">{item.name}</h4>
          <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
            {item.description}
          </p>
        </div>

        <div className="mt-auto grid gap-1">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
            Price
          </span>
          <span className="text-sm font-bold text-[var(--color-text)]">
            {formatPriceSummary(item)}
          </span>
        </div>
      </div>
    </button>
  );
}

function TabularMenuItemDetails({
  category,
  checkoutHref,
  item,
}: {
  category: TabularMenuCategory | null;
  checkoutHref: Route;
  item: TabularMenuItem;
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

      <div className="grid gap-2">
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
        <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
          {item.details}
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <h3 className="m-0 text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
          Price options
        </h3>
        <div className="mt-3 grid gap-2">
          {item.prices.map((price) => (
            <div
              className="flex items-center justify-between gap-4 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-3 py-2"
              key={price.id}
            >
              <span className="text-sm font-medium text-[var(--color-text-muted)]">
                {price.label ?? "Order"}
              </span>
              <PriceText amount={price.amount} />
            </div>
          ))}
        </div>
      </div>

      {item.ingredients.length > 0 ? (
        <div className="grid gap-3">
          <h3 className="m-0 text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            Includes
          </h3>
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
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
          Checkout uses live product data, trusted totals, and current delivery
          rules. Add items from the Products tab before placing an order.
        </p>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          href={checkoutHref}
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <span>Go to checkout</span>
        </Link>
      </div>
    </div>
  );
}

function formatPriceSummary(item: TabularMenuItem): string {
  if (item.prices.length === 1) {
    return formatNairaFromKobo(item.prices[0]?.amount ?? 0);
  }

  return item.prices
    .map((price) =>
      price.label
        ? `${price.label}: ${formatNairaFromKobo(price.amount)}`
        : formatNairaFromKobo(price.amount),
    )
    .join(" / ");
}

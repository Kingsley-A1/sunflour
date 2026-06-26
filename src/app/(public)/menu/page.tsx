import Link from "next/link";
import type { Route } from "next";
import { MenuBrowser } from "@/components/commerce/menu-browser";
import {
  MenuViewTabs,
  type MenuView,
} from "@/components/commerce/menu-view-tabs";
import { TabularMenuBrowser } from "@/components/commerce/tabular-menu-browser";
import { ErrorState } from "@/components/ui/error-state";
import { getPublicMenuSafe, getPublicTabularMenuSafe } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Menu",
};

interface MenuPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const params = await searchParams;
  const query = first(params.query)?.trim() ?? "";
  const categoryId = first(params.category)?.trim() ?? "";
  const view: MenuView = first(params.view) === "table" ? "table" : "products";
  const [{ menu, error }, tabularMenu] = await Promise.all([
    getPublicMenuSafe(),
    getPublicTabularMenuSafe(),
  ]);
  const sortedCategories = [...tabularMenu.categories].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
  );
  const activeCategoryId = sortedCategories.some(
    (category) => category.id === categoryId,
  )
    ? categoryId
    : "";

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <header className="max-w-3xl">
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Menu</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
          Browse Sunflour products
        </h1>
      </header>
      {sortedCategories.length > 0 ? (
        <nav
          aria-label="Menu categories"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          <Link
            className={categoryNavClass(view === "table" && !activeCategoryId)}
            href={"/menu?view=table" as Route}
          >
            All categories
          </Link>
          {sortedCategories.map((category) => (
            <Link
              className={categoryNavClass(activeCategoryId === category.id)}
              href={
                `/menu?view=table&category=${encodeURIComponent(category.id)}` as Route
              }
              key={category.id}
            >
              {category.label}
            </Link>
          ))}
        </nav>
      ) : null}
      <MenuViewTabs value={view} />
      {view === "table" ? (
        <TabularMenuBrowser
          checkoutHref="/checkout"
          content={tabularMenu}
          initialCategoryId={activeCategoryId || "all"}
        />
      ) : error || !menu ? (
        <ErrorState description={error ?? "Menu data is not available."} title="Menu unavailable" />
      ) : (
        <MenuBrowser initialQuery={query} key={query} menu={menu} />
      )}
    </main>
  );
}

function categoryNavClass(active: boolean): string {
  return active
    ? "min-h-11 shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-on-primary)]"
    : "min-h-11 shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]";
}

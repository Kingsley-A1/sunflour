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
  const view: MenuView = first(params.view) === "table" ? "table" : "products";
  const [{ menu, error }, tabularMenu] = await Promise.all([
    getPublicMenuSafe(),
    getPublicTabularMenuSafe(),
  ]);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <header className="max-w-3xl">
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Menu</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
          Browse Sunflour products
        </h1>
        <p className="m-0 mt-3 text-base leading-7 text-[var(--color-text-muted)]">
          Search, filter, and add available items to cart. Checkout will
          recalculate all trusted prices on the server.
        </p>
      </header>
      <MenuViewTabs value={view} />
      {view === "table" ? (
        <TabularMenuBrowser checkoutHref="/checkout" content={tabularMenu} />
      ) : error || !menu ? (
        <ErrorState description={error ?? "Menu data is not available."} title="Menu unavailable" />
      ) : (
        <MenuBrowser initialQuery={query} key={query} menu={menu} />
      )}
    </main>
  );
}

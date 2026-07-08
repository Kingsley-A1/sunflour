import { MenuBoard } from "@/components/commerce/menu-board";
import { MenuBrowser } from "@/components/commerce/menu-browser";
import {
  MenuViewTabs,
  type MenuView,
} from "@/components/commerce/menu-view-tabs";
import { PageHero } from "@/components/layout/page-hero";
import { ErrorState } from "@/components/ui/error-state";
import { getPublicMenuSafe } from "@/lib/api/server";

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
  const categorySlug = first(params.category)?.trim() ?? "";
  const viewParam = first(params.view);
  // The tabular menu was retired: any legacy ?view=table / ?tableCategory link
  // now resolves to the Products view (the product nav).
  const view: MenuView =
    viewParam === "products" ||
    viewParam === "table" ||
    categorySlug ||
    query
      ? "products"
      : "full";
  const { menu, error } = await getPublicMenuSafe();

  return (
    <>
      <PageHero
        eyebrow="Menu"
        title={
          <>
            Browse <span className="sf-text-gradient">Sunflour products</span>
          </>
        }
      />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
        <MenuViewTabs value={view} />
        {view === "full" ? (
          <MenuBoard />
        ) : error || !menu ? (
          <ErrorState
            description={error ?? "Menu data is not available."}
            title="Menu unavailable"
          />
        ) : (
          <MenuBrowser
            initialCategorySlug={categorySlug}
            initialQuery={query}
            key={`${query}-${categorySlug}`}
            menu={menu}
          />
        )}
      </main>
    </>
  );
}

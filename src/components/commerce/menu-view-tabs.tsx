"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

export type MenuView = "full" | "products";

interface MenuViewTabsProps {
  value: MenuView;
}

const items = [
  {
    value: "full",
    label: "Full menu",
  },
  {
    value: "products",
    label: "Products",
  },
] as const;

export function MenuViewTabs({ value }: MenuViewTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateView(nextView: string) {
    const params = new URLSearchParams(searchParams.toString());

    // Legacy tabular-menu params are no longer used.
    params.delete("tableCategory");

    // "full" is the default view, so it carries no query params.
    if (nextView === "full") {
      params.delete("view");
    } else {
      params.set("view", nextView);
    }

    // Drop the products-only params when leaving the Products view.
    if (nextView !== "products") {
      params.delete("category");
      params.delete("query");
    }

    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(href as Route, { scroll: false });
  }

  return (
    <Tabs
      items={[...items]}
      label="Menu views"
      onChange={updateView}
      value={value}
    />
  );
}

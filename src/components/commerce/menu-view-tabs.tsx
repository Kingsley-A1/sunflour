"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

export type MenuView = "products" | "table";

interface MenuViewTabsProps {
  value: MenuView;
}

const items = [
  {
    value: "products",
    label: "Products",
  },
  {
    value: "table",
    label: "Tabular menu",
  },
] as const;

export function MenuViewTabs({ value }: MenuViewTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateView(nextView: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextView === "products") {
      params.delete("view");
    } else {
      params.set("view", nextView);
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

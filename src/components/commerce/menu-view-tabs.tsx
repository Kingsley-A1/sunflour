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

    // "full" is the default view, so it carries no query params.
    if (nextView === "full") {
      params.delete("view");
    } else {
      params.set("view", nextView);
    }

    // Drop params that belong to the view we are leaving.
    if (nextView !== "products") {
      params.delete("category");
      params.delete("query");
    }
    // The tabular menu was retired; never carry its legacy param forward.
    params.delete("tableCategory");

    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(href as Route, { scroll: false });
  }

  return (
    <div className="flex justify-center">
      <Tabs
        items={[...items]}
        label="Menu views"
        onChange={updateView}
        value={value}
      />
    </div>
  );
}

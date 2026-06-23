"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Search } from "lucide-react";
import { SearchBar } from "@/components/commerce/search-bar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";

function menuSearchHref(query: string): Route {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return "/menu" as Route;
  }

  return `/menu?query=${encodeURIComponent(trimmedQuery)}` as Route;
}

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(menuSearchHref(query));
    setMobileOpen(false);
  }

  return (
    <>
      <form className="hidden w-64 xl:block" onSubmit={submitSearch} role="search">
        <SearchBar
          label="Search Sunflour menu"
          onChange={setQuery}
          placeholder="Search menu..."
          showLabel={false}
          value={query}
        />
      </form>

      <IconButton
        className="xl:hidden"
        icon={<Search className="h-5 w-5" aria-hidden="true" />}
        label="Search menu"
        onClick={() => setMobileOpen(true)}
      />

      <Sheet
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        panelClassName="max-w-md"
        title="Search menu"
      >
        <form className="grid gap-3" onSubmit={submitSearch} role="search">
          <SearchBar
            autoFocus
            label="Search Sunflour menu"
            onChange={setQuery}
            value={query}
          />
          <Button type="submit">Search menu</Button>
        </form>
      </Sheet>
    </>
  );
}

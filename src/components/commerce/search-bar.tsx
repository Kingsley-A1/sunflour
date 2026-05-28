"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--color-text)]">Search menu</span>
      <span className="flex min-h-12 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3">
        <Search className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
        <input
          className="min-h-11 flex-1 bg-transparent text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Bread, cake, pizza..."
          type="search"
          value={value}
        />
      </span>
    </label>
  );
}

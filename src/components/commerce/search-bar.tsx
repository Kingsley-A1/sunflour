"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  showLabel?: boolean;
}

export function SearchBar({
  value,
  onChange,
  autoFocus = false,
  className,
  label = "Search menu",
  placeholder = "Bread, cake, pizza...",
  showLabel = true,
}: SearchBarProps) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className={showLabel ? "text-sm font-semibold text-[var(--color-text)]" : "sr-only"}>
        {label}
      </span>
      <span className="flex min-h-12 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3">
        <Search className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
        <input
          autoFocus={autoFocus}
          className="min-h-11 flex-1 bg-transparent text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={value}
        />
      </span>
    </label>
  );
}

"use client";

import { useId, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  showLabel?: boolean;
  /** Candidate pool for predictive suggestions (e.g. product names). */
  suggestions?: string[];
  maxSuggestions?: number;
}

export function SearchBar({
  value,
  onChange,
  autoFocus = false,
  className,
  label = "Search menu",
  placeholder = "Bread, cake, pizza...",
  showLabel = true,
  suggestions = [],
  maxSuggestions = 6,
}: SearchBarProps) {
  const inputId = useId();
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();

    if (!query) {
      return [] as string[];
    }

    const seen = new Set<string>();
    const result: string[] = [];

    for (const suggestion of suggestions) {
      const normalized = suggestion.trim();
      const lower = normalized.toLowerCase();

      if (!normalized || lower === query || !lower.includes(query)) {
        continue;
      }
      if (seen.has(lower)) {
        continue;
      }

      seen.add(lower);
      result.push(normalized);

      if (result.length >= maxSuggestions) {
        break;
      }
    }

    return result;
  }, [suggestions, value, maxSuggestions]);

  const showList = open && matches.length > 0;

  function commit(next: string) {
    onChange(next);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showList) {
      if (event.key === "ArrowDown" && matches.length > 0) {
        event.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % matches.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) =>
          index <= 0 ? matches.length - 1 : index - 1,
        );
        break;
      case "Enter":
        if (activeIndex >= 0 && activeIndex < matches.length) {
          event.preventDefault();
          commit(matches[activeIndex]!);
        }
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <label
        className={
          showLabel
            ? "text-sm font-semibold text-[var(--color-text)]"
            : "sr-only"
        }
        htmlFor={inputId}
      >
        {label}
      </label>
      <div className="relative">
        <div className="flex min-h-12 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 shadow-[var(--shadow-raised)] transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] focus-within:border-[var(--color-border-focus)] focus-within:shadow-[var(--shadow-floating)]">
          <Search
            className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
          <input
            aria-activedescendant={
              showList && activeIndex >= 0
                ? `${listboxId}-opt-${activeIndex}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={showList ? listboxId : undefined}
            aria-expanded={showList}
            autoComplete="off"
            autoFocus={autoFocus}
            className="min-h-11 flex-1 bg-transparent text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
            id={inputId}
            onBlur={() => setOpen(false)}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            type="text"
            value={value}
          />
          {value ? (
            <button
              aria-label="Clear search"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              onClick={() => commit("")}
              onMouseDown={(event) => event.preventDefault()}
              type="button"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {showList ? (
          <ul
            aria-label={label}
            className="absolute left-0 right-0 z-[var(--layer-overlay)] mt-1 max-h-72 overflow-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-floating)] p-1 shadow-[var(--shadow-floating)]"
            id={listboxId}
            role="listbox"
          >
            {matches.map((match, index) => (
              <li
                aria-selected={index === activeIndex}
                className={cn(
                  "flex min-h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-xs)] px-3 text-sm",
                  index === activeIndex
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
                )}
                id={`${listboxId}-opt-${index}`}
                key={match}
                onClick={() => commit(match)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
              >
                <Search
                  aria-hidden="true"
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    index === activeIndex
                      ? "text-[var(--color-on-primary)]"
                      : "text-[var(--color-text-muted)]",
                  )}
                />
                <span className="truncate">{match}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

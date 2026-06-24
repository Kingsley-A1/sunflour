"use client";

import { useId, useRef } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface TabsItem {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface TabsProps {
  items: TabsItem[];
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({
  items,
  label,
  value,
  onChange,
  className,
}: TabsProps) {
  const tabListId = useId();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusEnabledTab(startIndex: number, direction: 1 | -1) {
    const total = items.length;

    for (let step = 1; step <= total; step += 1) {
      const candidateIndex = (startIndex + step * direction + total) % total;
      const candidate = items[candidateIndex];

      if (candidate && !candidate.disabled) {
        buttonRefs.current[candidateIndex]?.focus();
        onChange(candidate.value);
        return;
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusEnabledTab(index, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusEnabledTab(index, -1);
        break;
      case "Home":
        event.preventDefault();
        focusEnabledTab(-1, 1);
        break;
      case "End":
        event.preventDefault();
        focusEnabledTab(0, -1);
        break;
      default:
        break;
    }
  }

  return (
    <div className={cn("grid gap-3", className)}>
      <div
        aria-label={label}
        className="inline-flex w-full max-w-full gap-2 overflow-x-auto rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
        id={tabListId}
        role="tablist"
      >
        {items.map((item, index) => {
          const active = item.value === value;

          return (
            <button
              aria-controls={undefined}
              aria-selected={active}
              className={cn(
                "min-h-11 shrink-0 rounded-[var(--radius-pill)] px-4 text-sm font-semibold transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]",
                active
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-raised)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
                item.disabled && "cursor-not-allowed opacity-50",
              )}
              disabled={item.disabled}
              key={item.value}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              role="tab"
              tabIndex={active ? 0 : -1}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

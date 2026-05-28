import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, error, helpText, className, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  const describedBy = [
    helpText ? `${selectId}-help` : null,
    error ? `${selectId}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-[var(--color-text)]" htmlFor={selectId}>
        {label}
      </label>
      {helpText ? (
        <p className="m-0 text-sm text-[var(--color-text-muted)]" id={`${selectId}-help`}>
          {helpText}
        </p>
      ) : null}
      <select
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-11 rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 text-[var(--color-text)] shadow-sm outline-none transition",
          error
            ? "border-[var(--color-danger)]"
            : "border-[var(--color-border)] focus:border-[var(--color-focus)]",
          className,
        )}
        id={selectId}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="m-0 text-sm font-medium text-[var(--color-danger)]" id={`${selectId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
});

import { forwardRef, useId } from "react";
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
  const generatedId = useId();
  const selectId = id ?? props.name ?? generatedId;
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
          "min-h-[var(--control-height-md)] rounded-[var(--radius-sm)] border bg-[var(--color-surface-overlay)] px-3 text-[var(--color-text)] outline-none transition disabled:border-[var(--color-disabled-border)] disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-text)]",
          "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
          error
            ? "border-[var(--color-danger)]"
            : "border-[var(--color-border)] focus:border-[var(--color-focus)] focus-visible:border-[var(--color-focus)]",
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

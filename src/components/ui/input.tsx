import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, helpText, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const describedBy = [
    helpText ? `${inputId}-help` : null,
    error ? `${inputId}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-[var(--color-text)]" htmlFor={inputId}>
        {label}
      </label>
      {helpText ? (
        <p className="m-0 text-sm text-[var(--color-text-muted)]" id={`${inputId}-help`}>
          {helpText}
        </p>
      ) : null}
      <input
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-11 rounded-[var(--radius-sm)] border bg-[var(--color-bg)] px-3 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-soft)]",
          "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
          error
            ? "border-[var(--color-danger)]"
            : "border-[var(--color-border)] focus:border-[var(--color-focus)] focus-visible:border-[var(--color-focus)]",
          className,
        )}
        id={inputId}
        ref={ref}
        {...props}
      />
      {error ? (
        <p className="m-0 text-sm font-medium text-[var(--color-danger)]" id={`${inputId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
});

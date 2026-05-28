import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ id, label, error, className, ...props }, ref) {
  const checkboxId = id ?? props.name;

  return (
    <div className="grid gap-1">
      <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-[var(--color-text)]" htmlFor={checkboxId}>
        <input
          aria-invalid={Boolean(error)}
          className={cn(
            "h-5 w-5 rounded border-[var(--color-border)] accent-[var(--color-primary)]",
            className,
          )}
          id={checkboxId}
          ref={ref}
          type="checkbox"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error ? <p className="m-0 text-sm text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
  },
);

import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ id, label, error, helpText, className, ...props }, ref) {
  const textareaId = id ?? props.name;
  const describedBy = [
    helpText ? `${textareaId}-help` : null,
    error ? `${textareaId}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-[var(--color-text)]" htmlFor={textareaId}>
        {label}
      </label>
      {helpText ? (
        <p className="m-0 text-sm text-[var(--color-text-muted)]" id={`${textareaId}-help`}>
          {helpText}
        </p>
      ) : null}
      <textarea
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-28 rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] shadow-sm outline-none transition placeholder:text-[var(--color-text-soft)]",
          error
            ? "border-[var(--color-danger)]"
            : "border-[var(--color-border)] focus:border-[var(--color-focus)]",
          className,
        )}
        id={textareaId}
        ref={ref}
        {...props}
      />
      {error ? (
        <p className="m-0 text-sm font-medium text-[var(--color-danger)]" id={`${textareaId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
  },
);

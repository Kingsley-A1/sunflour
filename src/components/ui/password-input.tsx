"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  helpText?: string;
}

export function PasswordInput({
  id,
  label,
  error,
  helpText,
  className,
  ...props
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);
  const describedBy = [
    helpText ? `${inputId}-help` : null,
    error ? `${inputId}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-2">
      <label
        className="text-sm font-semibold text-[var(--color-text)]"
        htmlFor={inputId}
      >
        {label}
      </label>
      {helpText ? (
        <p
          className="m-0 text-sm text-[var(--color-text-muted)]"
          id={`${inputId}-help`}
        >
          {helpText}
        </p>
      ) : null}
      <div className="relative">
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            "min-h-[var(--control-height-md)] w-full rounded-[var(--radius-sm)] border bg-[var(--color-surface-overlay)] px-3 pr-12 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-soft)] disabled:border-[var(--color-disabled-border)] disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-text)]",
            "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
            error
              ? "border-[var(--color-danger)]"
              : "border-[var(--color-border)] focus:border-[var(--color-focus)] focus-visible:border-[var(--color-focus)]",
            className,
          )}
          id={inputId}
          type={isVisible ? "text" : "password"}
          {...props}
        />
        <button
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="absolute inset-y-1 right-1 inline-flex min-h-9 min-w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          onClick={() => setIsVisible((value) => !value)}
          type="button"
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error ? (
        <p
          className="m-0 text-sm font-medium text-[var(--color-danger)]"
          id={`${inputId}-error`}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

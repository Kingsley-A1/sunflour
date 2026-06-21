import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/status";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

const toneClasses: Record<StatusTone, string> = {
  neutral:
    "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
  success:
    "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success-text)]",
  warning:
    "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning-text)]",
  danger:
    "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger-text)]",
  info:
    "border-[var(--color-info)] bg-[var(--color-info-soft)] text-[var(--color-info-text)]",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-[var(--radius-pill)] border px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

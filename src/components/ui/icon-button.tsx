import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
}

export function IconButton({
  className,
  label,
  icon,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex h-[var(--control-height-md)] w-[var(--control-height-md)] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:border-[var(--color-disabled-border)] disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-text)] disabled:opacity-100",
        "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
        className,
      )}
      title={label}
      type={type}
      {...props}
    >
      {icon}
    </button>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-pressed)]",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
  ghost:
    "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
  danger:
    "bg-[var(--color-danger)] text-[var(--color-text-inverse)] hover:brightness-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[var(--control-height-sm)] px-3 text-sm",
  md: "min-h-[var(--control-height-md)] px-4 text-sm",
  lg: "min-h-[var(--control-height-lg)] px-5 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  icon,
  children,
  style,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] text-center font-semibold transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] disabled:cursor-not-allowed disabled:opacity-55",
        "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      style={
        variant === "primary"
          ? { ...style, color: "var(--color-on-primary)" }
          : variant === "danger"
            ? { ...style, color: "var(--color-text-inverse)" }
            : style
      }
      type={type}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

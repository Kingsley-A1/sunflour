import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  href?: Route;
}

const cardClasses =
  "grid min-h-32 gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-raised)] transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]";

function MetricCardBody({ label, value, description }: MetricCardProps) {
  return (
    <>
      <p className="m-0 text-sm font-semibold text-[var(--color-text-muted)]">{label}</p>
      <p className="m-0 text-3xl font-extrabold tabular-nums text-[var(--color-text)]">
        {value}
      </p>
      <p className="m-0 text-xs leading-5 text-[var(--color-text-muted)]">
        {description}
      </p>
    </>
  );
}

export function MetricCard({ label, value, description, href }: MetricCardProps) {
  if (href) {
    return (
      <Link
        className={cn(
          cardClasses,
          "hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]",
        )}
        href={href}
      >
        <MetricCardBody description={description} label={label} value={value} />
      </Link>
    );
  }

  return (
    <article className={cardClasses}>
      <MetricCardBody description={description} label={label} value={value} />
    </article>
  );
}

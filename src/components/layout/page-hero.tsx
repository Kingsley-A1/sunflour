import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

/**
 * Shared public hero surface. It reuses the homepage hero treatment — the warm
 * mesh gradient (`sf-hero-surface`), a frosted eyebrow chip, and an optional
 * gradient-accented title — so every public page opens with the same confident,
 * branded first impression.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  icon: Icon = Sparkles,
  actions,
  aside,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "sf-hero-surface border-b border-[var(--color-border)]",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-6xl px-4 py-10 lg:py-12",
          Boolean(aside) &&
            "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-end",
        )}
      >
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)] shadow-[var(--shadow-raised)] backdrop-blur">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {eyebrow}
          </span>
          <h1 className="m-0 mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="m-0 mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
              {description}
            </p>
          ) : null}
          {actions ? (
            <div className="mt-5 flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
    </section>
  );
}

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Gift } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import type { PublicWeeklyOffer } from "@/types/domain";

interface WeeklyOfferCardProps {
  offer: PublicWeeklyOffer;
  /** Past offers are shown muted and without a call to action. */
  tone?: "current" | "upcoming" | "past";
}

function toneLabel(tone: "current" | "upcoming" | "past"): string {
  if (tone === "current") {
    return "This week's offer";
  }

  return tone === "upcoming" ? "Coming soon" : "Past offer";
}

export function WeeklyOfferCard({ offer, tone = "current" }: WeeklyOfferCardProps) {
  const isPast = tone === "past";

  return (
    <article
      className={`grid min-w-0 overflow-hidden rounded-[var(--radius-product)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-raised)] sm:grid-cols-2 ${
        isPast ? "opacity-80" : ""
      }`}
    >
      <div className="relative aspect-[4/3] bg-[var(--color-surface-muted)] sm:aspect-auto sm:min-h-56">
        {offer.cardImageUrl ? (
          <SafeImage
            alt={offer.headline}
            className="object-cover"
            fallback={
              <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
                {offer.headline}
              </div>
            }
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            src={offer.cardImageUrl}
          />
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
            {offer.headline}
          </div>
        )}
      </div>

      <div className="grid min-w-0 content-start gap-3 p-5">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[var(--color-text)]">
          <Gift className="h-3.5 w-3.5" aria-hidden="true" />
          {toneLabel(tone)}
        </span>

        <h3 className="m-0 wrap-anywhere text-2xl font-extrabold leading-tight">
          {offer.headline}
        </h3>

        {offer.purchaseProductName ? (
          <p className="m-0 wrap-anywhere text-sm leading-6 text-[var(--color-text)]">
            Buy <strong>{offer.purchaseProductName}</strong> and get{" "}
            <strong>{offer.freeItemLabel}</strong> free.
          </p>
        ) : (
          <p className="m-0 wrap-anywhere text-sm leading-6 text-[var(--color-text)]">
            Get <strong>{offer.freeItemLabel}</strong> free with this offer.
          </p>
        )}

        {offer.description ? (
          <p className="m-0 wrap-anywhere text-sm leading-6 text-[var(--color-text-muted)]">
            {offer.description}
          </p>
        ) : null}

        <p className="m-0 text-xs font-semibold text-[var(--color-text-muted)]">
          {offer.weekStart} &ndash; {offer.weekEnd}
        </p>

        {!isPast && offer.purchaseProductSlug ? (
          <Link
            className="mt-1 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 text-sm font-bold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
            href={`/products/${offer.purchaseProductSlug}` as Route}
          >
            {tone === "current" ? "Grab this offer" : "View the product"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

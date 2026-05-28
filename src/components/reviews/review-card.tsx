import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/formatters";
import type { PublicReview } from "@/types/domain";

interface ReviewCardProps {
  review: PublicReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="grid gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-bold">{review.customerNameSnapshot}</h2>
          <p className="m-0 text-xs text-[var(--color-text-muted)]">
            {formatDateTime(review.createdAt)}
          </p>
        </div>
        <p className="m-0 inline-flex items-center gap-1 text-sm font-bold" aria-label={`${review.rating} out of 5 stars`}>
          <Star className="h-4 w-4 text-[var(--color-warning)]" fill="currentColor" aria-hidden="true" />
          {review.rating}/5
        </p>
      </div>
      <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
        {review.comment}
      </p>
      {review.product ? (
        <p className="m-0 text-xs font-semibold text-[var(--color-text-muted)]">
          Product: {review.product.name}
        </p>
      ) : null}
    </Card>
  );
}

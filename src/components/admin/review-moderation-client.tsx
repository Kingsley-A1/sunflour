"use client";

import { useState } from "react";
import { getApiErrorMessage, moderateAdminReview } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/ui/status-pill";
import type { ReviewStatus } from "@/types/domain";

interface AdminReview {
  id: string;
  customerNameSnapshot: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  moderationReason: string | null;
  createdAt: Date | string;
  product: {
    name: string;
  } | null;
}

interface ReviewModerationClientProps {
  reviews: AdminReview[];
}

export function ReviewModerationClient({ reviews }: ReviewModerationClientProps) {
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function moderate(id: string, status: Exclude<ReviewStatus, "PENDING">) {
    setMessage(null);
    setError(null);

    try {
      await moderateAdminReview({
        id,
        status,
        reason: reasonById[id] || undefined,
      });
      setMessage("Review moderation saved. Refresh to see the latest queue.");
    } catch (moderationError) {
      setError(getApiErrorMessage(moderationError, "Review moderation failed."));
    }
  }

  return (
    <div className="grid gap-4">
      {error ? <p className="m-0 text-sm font-semibold text-[var(--color-danger)]">{error}</p> : null}
      {message ? <p className="m-0 text-sm font-semibold text-[var(--color-success)]">{message}</p> : null}
      {reviews.map((review) => (
        <article
          className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          key={review.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="m-0 text-base font-bold">{review.customerNameSnapshot}</h2>
              <p className="m-0 text-sm text-[var(--color-text-muted)]">
                Rating {review.rating}/5 {review.product ? `for ${review.product.name}` : ""}
              </p>
            </div>
            <StatusPill status={review.status} />
          </div>
          <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
            {review.comment}
          </p>
          <Textarea
            label="Moderation reason"
            onChange={(event) =>
              setReasonById((current) => ({
                ...current,
                [review.id]: event.target.value,
              }))
            }
            value={reasonById[review.id] ?? ""}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => moderate(review.id, "APPROVED")} variant="secondary">
              Approve
            </Button>
            <Button onClick={() => moderate(review.id, "REJECTED")} variant="danger">
              Reject
            </Button>
            <Button onClick={() => moderate(review.id, "HIDDEN")} variant="secondary">
              Hide
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

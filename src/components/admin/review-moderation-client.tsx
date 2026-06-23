"use client";

import { useState } from "react";
import { getApiErrorMessage, moderateAdminReview } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
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
  const [pendingModeration, setPendingModeration] = useState<{
    review: AdminReview;
    status: Exclude<ReviewStatus, "PENDING">;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function moderate() {
    if (!pendingModeration) {
      return;
    }

    setMessage(null);
    setError(null);
    setIsSaving(true);

    try {
      await moderateAdminReview({
        id: pendingModeration.review.id,
        status: pendingModeration.status,
        reason: reasonById[pendingModeration.review.id] || undefined,
      });
      setMessage("Review moderation saved and audited.");
      setPendingModeration(null);
    } catch (moderationError) {
      setError(getApiErrorMessage(moderationError, "Review moderation failed."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      {error ? <p className="m-0 text-sm font-semibold text-[var(--color-danger)]" role="alert">{error}</p> : null}
      {message ? <p className="m-0 text-sm font-semibold text-[var(--color-success)]" role="status">{message}</p> : null}
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
            <Button onClick={() => setPendingModeration({ review, status: "APPROVED" })} variant="secondary">
              Approve
            </Button>
            <Button onClick={() => setPendingModeration({ review, status: "REJECTED" })} variant="danger">
              Reject
            </Button>
            <Button onClick={() => setPendingModeration({ review, status: "HIDDEN" })} variant="secondary">
              Hide
            </Button>
          </div>
        </article>
      ))}
      <ConfirmDialog
        confirmLabel={pendingModeration?.status === "APPROVED" ? "Approve review" : "Confirm moderation"}
        description={
          pendingModeration
            ? `Set ${pendingModeration.review.customerNameSnapshot}'s review to ${pendingModeration.status.toLowerCase()}. This moderation action is recorded for audit.`
            : "Confirm this review moderation action."
        }
        destructive={pendingModeration?.status === "REJECTED" || pendingModeration?.status === "HIDDEN"}
        loading={isSaving}
        onCancel={() => setPendingModeration(null)}
        onConfirm={moderate}
        open={Boolean(pendingModeration)}
        title="Confirm review moderation"
      />
    </div>
  );
}

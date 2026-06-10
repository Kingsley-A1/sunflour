"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  getApiFieldError,
  submitPublicReview,
} from "@/lib/api/client";
import { ApiClientError } from "@/types/api";

function containsHtmlMarkup(value: string): boolean {
  return /<[^>]*>/.test(value);
}

export function ReviewForm() {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setFieldErrors({});

    if (name.trim().length < 2) {
      setFieldErrors({ customerName: "Enter your name." });
      return;
    }

    if (containsHtmlMarkup(name)) {
      setFieldErrors({
        customerName: "Enter your name without HTML or scripts.",
      });
      return;
    }

    if (comment.trim().length < 10) {
      setFieldErrors({
        comment: "Write at least 10 characters about your experience.",
      });
      return;
    }

    if (containsHtmlMarkup(comment)) {
      setFieldErrors({
        comment: "Write your review as plain text, without HTML or scripts.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitPublicReview({
        customerName: name,
        rating,
        comment,
      });

      setMessage("Review submitted. It will appear after Sunflour approves it.");
      setName("");
      setComment("");
      setRating(5);
    } catch (reviewError) {
      if (reviewError instanceof ApiClientError) {
        setFieldErrors({
          customerName:
            getApiFieldError(
              reviewError.fieldErrors,
              "customerName",
              "name",
            ) ?? "",
          comment: getApiFieldError(reviewError.fieldErrors, "comment") ?? "",
          rating: getApiFieldError(reviewError.fieldErrors, "rating") ?? "",
        });
      }

      setError(
        getApiErrorMessage(
          reviewError,
          "Review submission failed. Check the fields and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4" onSubmit={submitReview}>
      <div>
        <h2 className="m-0 text-xl font-bold">Leave a review</h2>
        <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
          Reviews are moderated before they appear publicly.
        </p>
      </div>
      {error ? <p className="m-0 text-sm font-semibold text-[var(--color-danger)]">{error}</p> : null}
      {message ? <p className="m-0 text-sm font-semibold text-[var(--color-success)]">{message}</p> : null}
      <Input
        error={fieldErrors.customerName || undefined}
        label="Name"
        name="customerName"
        onChange={(event) => setName(event.target.value)}
        value={name}
      />
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">Rating</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
              className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-semibold"
              key={value}
              onClick={() => setRating(value)}
              type="button"
            >
              <Star
                className="h-4 w-4"
                fill={rating >= value ? "currentColor" : "none"}
                aria-hidden="true"
              />
              {value}
            </button>
          ))}
        </div>
        {fieldErrors.rating ? (
          <p className="m-0 text-sm font-medium text-[var(--color-danger)]">
            {fieldErrors.rating}
          </p>
        ) : null}
      </fieldset>
      <Textarea
        error={fieldErrors.comment || undefined}
        label="Review"
        name="comment"
        onChange={(event) => setComment(event.target.value)}
        value={comment}
      />
      <Button loading={isSubmitting} type="submit">
        Submit for moderation
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm() {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }

    if (comment.trim().length < 10) {
      setError("Write at least 10 characters about your experience.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/public/reviews", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          customerName: name,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error("Review API unavailable.");
      }

      setMessage("Review submitted. It will appear after Sunflour approves it.");
      setName("");
      setComment("");
      setRating(5);
    } catch {
      setError(
        "Review submission is waiting on the backend reviews endpoint. Try again after moderation APIs are enabled.",
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
      <Input label="Name" name="name" onChange={(event) => setName(event.target.value)} value={name} />
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">Rating</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
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
      </fieldset>
      <Textarea
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

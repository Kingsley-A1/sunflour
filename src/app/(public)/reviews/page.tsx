import { ReviewForm } from "@/app/(public)/reviews/review-form";
import { EmptyState } from "@/components/ui/empty-state";
import { ReviewCard } from "@/components/reviews/review-card";
import { listApprovedReviews } from "@/server/modules/reviews";
import type { PublicReview } from "@/types/domain";

export const metadata = {
  title: "Reviews",
};

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = (await listApprovedReviews({ limit: 20 })).map((review) => ({
    ...review,
    createdAt: review.createdAt.toISOString(),
  })) as PublicReview[];

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <section className="grid gap-5">
        <header>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Reviews</p>
          <h1 className="m-0 mt-2 text-3xl font-extrabold sm:text-4xl">Customer reviews</h1>
          <p className="m-0 mt-3 text-base leading-7 text-[var(--color-text-muted)]">
            Public reviews will show only after backend moderation approves them.
          </p>
        </header>
        {reviews.length === 0 ? (
          <EmptyState
            description="Approved reviews will appear here after moderation."
            title="No approved reviews yet"
          />
        ) : (
          <div className="grid gap-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>
      <ReviewForm />
    </main>
  );
}

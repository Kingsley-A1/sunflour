import { ReviewForm } from "@/app/(public)/reviews/review-form";
import { PageHero } from "@/components/layout/page-hero";
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
    <>
      <PageHero
        description="Public reviews appear only after our team approves them, so everything here is genuine, moderated feedback."
        eyebrow="Reviews"
        title={
          <>
            Customer <span className="sf-text-gradient">reviews</span>
          </>
        }
      />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section aria-label="Approved reviews" className="grid gap-5">
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
    </>
  );
}

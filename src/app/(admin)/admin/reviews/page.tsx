import { ReviewModerationClient } from "@/components/admin/review-moderation-client";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/server/auth/rbac";
import { REVIEW_ADMIN_ROLES } from "@/server/auth/roles";
import { listAdminReviews } from "@/server/modules/reviews";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Reviews",
};

export default async function AdminReviewsPage() {
  await requireRole(REVIEW_ADMIN_ROLES);
  const { reviews } = await listAdminReviews({ page: 1, pageSize: 25 });

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Reviews</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Review moderation</h1>
      </header>
      {reviews.length === 0 ? (
        <EmptyState
          description="There are no reviews in the moderation queue."
          title="No reviews"
        />
      ) : (
        <ReviewModerationClient reviews={reviews} />
      )}
    </div>
  );
}

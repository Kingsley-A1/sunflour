import { getOptionalAuth } from "@/server/auth/rbac";
import { getClientIp, readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import {
  createPublicReview,
  listApprovedReviews,
  publicReviewCreateSchema,
  publicReviewListQuerySchema,
} from "@/server/modules/reviews";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const input = validateInput(publicReviewListQuerySchema, {
      productId: searchParams.get("productId") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    return apiSuccess({
      reviews: await listApprovedReviews(input),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `public-review:${getClientIp(request)}`,
      limit: 5,
      windowMs: 60 * 60_000,
    });

    const user = await getOptionalAuth();
    const input = validateInput(
      publicReviewCreateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(
      {
        review: await createPublicReview(input, user),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

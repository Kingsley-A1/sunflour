import { requireRole } from "@/server/auth/rbac";
import { REVIEW_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  moderateReview,
  reviewIdParamSchema,
  reviewModerationSchema,
} from "@/server/modules/reviews";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ReviewModerationRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: Request,
  context: ReviewModerationRouteContext,
) {
  try {
    const actor = await requireRole(REVIEW_ADMIN_ROLES);
    const params = validateInput(reviewIdParamSchema, await context.params);
    const input = validateInput(
      reviewModerationSchema,
      await readJsonBody(request),
    );

    return apiSuccess({
      review: await moderateReview(params.id, input, actor),
    });
  } catch (error) {
    return apiError(error);
  }
}

import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  adminReviewListQuerySchema,
  listAdminReviews,
} from "@/server/modules/reviews";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireRole(ADMIN_ROLES);
    const searchParams = new URL(request.url).searchParams;
    const input = validateInput(adminReviewListQuerySchema, {
      status: searchParams.get("status") ?? undefined,
      productId: searchParams.get("productId") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    return apiSuccess(await listAdminReviews(input));
  } catch (error) {
    return apiError(error);
  }
}

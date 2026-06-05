import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import { presignedUploadRequestSchema } from "@/server/modules/media/media-schemas";
import { createPresignedProductImageUpload } from "@/server/modules/media/media-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const actor = await requireRole(PRODUCT_CONTENT_ROLES);
    enforceRateLimit({
      key: `media-presign:${actor.id}`,
      limit: 30,
      windowMs: 15 * 60_000,
    });
    const input = validateInput(
      presignedUploadRequestSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await createPresignedProductImageUpload(input, actor), {
      status: 201,
    });
  } catch (error) {
    return apiError(error);
  }
}

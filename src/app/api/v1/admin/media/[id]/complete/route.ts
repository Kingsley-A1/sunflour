import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  completeMediaUploadSchema,
  mediaIdParamSchema,
} from "@/server/modules/media/media-schemas";
import { completeMediaAssetUpload } from "@/server/modules/media/media-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CompleteMediaRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  context: CompleteMediaRouteContext,
) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(mediaIdParamSchema, await context.params);
    const input = validateInput(
      completeMediaUploadSchema,
      await readJsonBody(request),
    );

    return apiSuccess(
      await completeMediaAssetUpload(params.id, actor, input.publicUrl),
    );
  } catch (error) {
    return apiError(error);
  }
}

import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { requireRole } from "@/server/auth/rbac";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  emailTemplateParamSchema,
  emailTemplateUpdateSchema,
  upsertEmailTemplateForAdmin,
} from "@/server/modules/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface EmailTemplateRouteContext {
  params: Promise<{ key: string }>;
}

export async function PATCH(
  request: Request,
  context: EmailTemplateRouteContext,
) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(emailTemplateParamSchema, await context.params);
    const input = validateInput(
      emailTemplateUpdateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(
      await upsertEmailTemplateForAdmin(params.key, input, actor),
    );
  } catch (error) {
    return apiError(error);
  }
}

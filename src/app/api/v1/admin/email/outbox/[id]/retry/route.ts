import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { requireRole } from "@/server/auth/rbac";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  emailOutboxIdParamSchema,
  retryFailedEmail,
} from "@/server/modules/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface EmailRetryRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: EmailRetryRouteContext) {
  try {
    await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(emailOutboxIdParamSchema, await context.params);

    return apiSuccess(await retryFailedEmail(params.id));
  } catch (error) {
    return apiError(error);
  }
}

import { ADMIN_ROLES } from "@/server/auth/roles";
import { requireRole } from "@/server/auth/rbac";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  emailOutboxListQuerySchema,
  listEmailOutboxForAdmin,
} from "@/server/modules/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireRole(ADMIN_ROLES);
    const searchParams = new URL(request.url).searchParams;
    const input = validateInput(emailOutboxListQuerySchema, {
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    return apiSuccess({
      emails: await listEmailOutboxForAdmin(input),
    });
  } catch (error) {
    return apiError(error);
  }
}

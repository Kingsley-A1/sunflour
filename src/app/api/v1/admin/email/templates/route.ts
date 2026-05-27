import { ADMIN_ROLES } from "@/server/auth/roles";
import { requireRole } from "@/server/auth/rbac";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { getEmailTemplatesForAdmin } from "@/server/modules/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(ADMIN_ROLES);

    return apiSuccess({
      templates: await getEmailTemplatesForAdmin(),
    });
  } catch (error) {
    return apiError(error);
  }
}

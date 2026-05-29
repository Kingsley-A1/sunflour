import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  auditLogListQuerySchema,
  listAuditLogsForAdmin,
} from "@/server/modules/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireRole(SUPER_ADMIN_ROLES);
    const searchParams = new URL(request.url).searchParams;
    const input = validateInput(auditLogListQuerySchema, {
      actorUserId: searchParams.get("actorUserId") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      targetType: searchParams.get("targetType") ?? undefined,
      targetId: searchParams.get("targetId") ?? undefined,
      createdFrom: searchParams.get("createdFrom") ?? undefined,
      createdTo: searchParams.get("createdTo") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    return apiSuccess(await listAuditLogsForAdmin(input));
  } catch (error) {
    return apiError(error);
  }
}

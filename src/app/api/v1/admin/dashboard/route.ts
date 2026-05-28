import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  dashboardMetricsQuerySchema,
  getDashboardMetrics,
} from "@/server/modules/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireRole(ADMIN_ROLES);
    const searchParams = new URL(request.url).searchParams;
    const input = validateInput(dashboardMetricsQuerySchema, {
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    return apiSuccess(await getDashboardMetrics(input));
  } catch (error) {
    return apiError(error);
  }
}

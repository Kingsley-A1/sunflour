import { requireRole } from "@/server/auth/rbac";
import { ANALYTICS_ROLES } from "@/server/auth/roles";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  analyticsReportQuerySchema,
  getAnalyticsReport,
} from "@/server/modules/analytics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireRole(ANALYTICS_ROLES);
    const searchParams = new URL(request.url).searchParams;
    const input = validateInput(analyticsReportQuerySchema, {
      range: searchParams.get("range") ?? undefined,
    });

    return apiSuccess(await getAnalyticsReport(input));
  } catch (error) {
    return apiError(error);
  }
}

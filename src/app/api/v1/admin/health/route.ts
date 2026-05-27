import { apiError, apiSuccess } from "@/server/lib/api/response";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { requireRole } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireRole(ADMIN_ROLES);

    return apiSuccess({
      service: "sunflour-admin-api",
      status: "ok",
      role: user.role,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}

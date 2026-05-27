import { apiError, apiSuccess } from "@/server/lib/api/response";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireRole(SUPER_ADMIN_ROLES);

    return apiSuccess({
      service: "sunflour-super-admin-api",
      status: "ok",
      role: user.role,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}

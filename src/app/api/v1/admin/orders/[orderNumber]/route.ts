import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  getAdminOrderDetail,
  orderNumberParamSchema,
} from "@/server/modules/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AdminOrderRouteContext {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(
  _request: Request,
  context: AdminOrderRouteContext,
) {
  try {
    await requireRole(ADMIN_ROLES);
    const params = validateInput(
      orderNumberParamSchema,
      await context.params,
    );

    return apiSuccess(await getAdminOrderDetail(params.orderNumber));
  } catch (error) {
    return apiError(error);
  }
}

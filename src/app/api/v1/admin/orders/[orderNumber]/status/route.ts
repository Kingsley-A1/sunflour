import { requireRole } from "@/server/auth/rbac";
import { ORDER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  orderNumberParamSchema,
  orderStatusUpdateSchema,
  updateAdminOrderStatus,
} from "@/server/modules/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AdminOrderStatusRouteContext {
  params: Promise<{ orderNumber: string }>;
}

export async function PATCH(
  request: Request,
  context: AdminOrderStatusRouteContext,
) {
  try {
    const actor = await requireRole(ORDER_ADMIN_ROLES);
    const params = validateInput(
      orderNumberParamSchema,
      await context.params,
    );
    const input = validateInput(
      orderStatusUpdateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(
      await updateAdminOrderStatus(params.orderNumber, input, actor),
    );
  } catch (error) {
    return apiError(error);
  }
}

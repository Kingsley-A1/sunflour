import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  deliveryZoneUpdateSchema,
  idParamSchema,
} from "@/server/modules/delivery/delivery-schemas";
import {
  archiveDeliveryZone,
  updateDeliveryZone,
} from "@/server/modules/delivery/delivery-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface DeliveryZoneRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: Request,
  context: DeliveryZoneRouteContext,
) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);
    const input = validateInput(
      deliveryZoneUpdateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await updateDeliveryZone(params.id, input, actor));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: DeliveryZoneRouteContext,
) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);

    return apiSuccess(await archiveDeliveryZone(params.id, actor));
  } catch (error) {
    return apiError(error);
  }
}

import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  deliveryZoneCreateSchema,
} from "@/server/modules/delivery/delivery-schemas";
import {
  createDeliveryZone,
  listAdminDeliveryZones,
} from "@/server/modules/delivery/delivery-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(SUPER_ADMIN_ROLES);

    return apiSuccess({
      zones: await listAdminDeliveryZones(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const input = validateInput(
      deliveryZoneCreateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await createDeliveryZone(input, actor), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

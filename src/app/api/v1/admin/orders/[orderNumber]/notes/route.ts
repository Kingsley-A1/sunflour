import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  orderAdminNoteUpdateSchema,
  orderNumberParamSchema,
  updateAdminOrderNote,
} from "@/server/modules/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AdminOrderNotesRouteContext {
  params: Promise<{ orderNumber: string }>;
}

export async function PATCH(
  request: Request,
  context: AdminOrderNotesRouteContext,
) {
  try {
    const actor = await requireRole(ADMIN_ROLES);
    const params = validateInput(
      orderNumberParamSchema,
      await context.params,
    );
    const input = validateInput(
      orderAdminNoteUpdateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(
      await updateAdminOrderNote(params.orderNumber, input, actor),
    );
  } catch (error) {
    return apiError(error);
  }
}

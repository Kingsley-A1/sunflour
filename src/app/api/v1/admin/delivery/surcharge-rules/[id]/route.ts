import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  deliverySurchargeRuleUpdateSchema,
  idParamSchema,
} from "@/server/modules/delivery/delivery-schemas";
import {
  archiveSurchargeRule,
  updateSurchargeRule,
} from "@/server/modules/delivery/delivery-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SurchargeRuleRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: Request,
  context: SurchargeRuleRouteContext,
) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);
    const input = validateInput(
      deliverySurchargeRuleUpdateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await updateSurchargeRule(params.id, input, actor));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: SurchargeRuleRouteContext,
) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);

    return apiSuccess(await archiveSurchargeRule(params.id, actor));
  } catch (error) {
    return apiError(error);
  }
}

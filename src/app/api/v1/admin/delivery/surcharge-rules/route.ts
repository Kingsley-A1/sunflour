import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  deliverySurchargeRuleCreateSchema,
} from "@/server/modules/delivery/delivery-schemas";
import {
  createSurchargeRule,
  listAdminSurchargeRules,
} from "@/server/modules/delivery/delivery-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(SUPER_ADMIN_ROLES);

    return apiSuccess({
      surchargeRules: await listAdminSurchargeRules(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const input = validateInput(
      deliverySurchargeRuleCreateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await createSurchargeRule(input, actor), {
      status: 201,
    });
  } catch (error) {
    return apiError(error);
  }
}

import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  categoryUpdateSchema,
  idParamSchema,
} from "@/server/modules/menu/catalog-schemas";
import {
  archiveCategory,
  updateCategory,
} from "@/server/modules/menu/catalog-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CategoryRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: CategoryRouteContext) {
  try {
    await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);
    const input = validateInput(categoryUpdateSchema, await readJsonBody(request));

    return apiSuccess(await updateCategory(params.id, input));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: CategoryRouteContext) {
  try {
    await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);

    return apiSuccess(await archiveCategory(params.id));
  } catch (error) {
    return apiError(error);
  }
}

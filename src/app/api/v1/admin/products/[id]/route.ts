import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES, SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  idParamSchema,
  productUpdateSchema,
} from "@/server/modules/menu/catalog-schemas";
import {
  archiveProduct,
  getAdminProduct,
  updateProduct,
} from "@/server/modules/menu/catalog-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ProductRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: ProductRouteContext) {
  try {
    await requireRole(ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);

    return apiSuccess(await getAdminProduct(params.id));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: ProductRouteContext) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);
    const input = validateInput(productUpdateSchema, await readJsonBody(request));

    return apiSuccess(await updateProduct(params.id, input, actor));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: ProductRouteContext) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);

    return apiSuccess(await archiveProduct(params.id, actor));
  } catch (error) {
    return apiError(error);
  }
}

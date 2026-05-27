import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  idParamSchema,
  productStatusUpdateSchema,
} from "@/server/modules/menu/catalog-schemas";
import { updateProductStatus } from "@/server/modules/menu/catalog-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ProductStatusRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: Request,
  context: ProductStatusRouteContext,
) {
  try {
    const actor = await requireRole(ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);
    const input = validateInput(
      productStatusUpdateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await updateProductStatus(params.id, input, actor));
  } catch (error) {
    return apiError(error);
  }
}

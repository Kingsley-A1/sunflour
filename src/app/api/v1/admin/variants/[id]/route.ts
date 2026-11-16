import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import { revalidateCatalogViews } from "@/server/modules/menu/catalog-revalidation";
import {
  idParamSchema,
  productVariantUpdateSchema,
} from "@/server/modules/menu/catalog-schemas";
import {
  archiveProductVariant,
  updateProductVariant,
} from "@/server/modules/menu/catalog-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface VariantRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: VariantRouteContext) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);
    const input = validateInput(
      productVariantUpdateSchema,
      await readJsonBody(request),
    );

    const variant = await updateProductVariant(params.id, input, actor);
    revalidateCatalogViews();

    return apiSuccess(variant);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: VariantRouteContext) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);

    const variant = await archiveProductVariant(params.id, actor);
    revalidateCatalogViews();

    return apiSuccess(variant);
  } catch (error) {
    return apiError(error);
  }
}

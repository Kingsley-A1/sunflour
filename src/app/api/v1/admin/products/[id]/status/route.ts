import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_AVAILABILITY_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  idParamSchema,
  productStatusUpdateSchema,
} from "@/server/modules/menu/catalog-schemas";
import { revalidateCatalogViews } from "@/server/modules/menu/catalog-revalidation";
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
    const actor = await requireRole(PRODUCT_AVAILABILITY_ROLES);
    const params = validateInput(idParamSchema, await context.params);
    const input = validateInput(
      productStatusUpdateSchema,
      await readJsonBody(request),
    );
    const product = await updateProductStatus(params.id, input, actor);

    revalidateCatalogViews(product.slug);

    return apiSuccess(product);
  } catch (error) {
    return apiError(error);
  }
}

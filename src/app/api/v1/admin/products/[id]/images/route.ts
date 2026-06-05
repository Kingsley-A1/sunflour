import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  idParamSchema,
  productImageCreateSchema,
} from "@/server/modules/menu/catalog-schemas";
import { attachProductImage } from "@/server/modules/menu/catalog-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ProductImageRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: ProductImageRouteContext) {
  try {
    const actor = await requireRole(PRODUCT_CONTENT_ROLES);
    const params = validateInput(idParamSchema, await context.params);
    const input = validateInput(
      productImageCreateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await attachProductImage(params.id, input, actor), {
      status: 201,
    });
  } catch (error) {
    return apiError(error);
  }
}

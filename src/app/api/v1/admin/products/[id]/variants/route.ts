import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  idParamSchema,
  productVariantCreateSchema,
} from "@/server/modules/menu/catalog-schemas";
import { createProductVariant } from "@/server/modules/menu/catalog-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ProductVariantRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  context: ProductVariantRouteContext,
) {
  try {
    await requireRole(SUPER_ADMIN_ROLES);
    const params = validateInput(idParamSchema, await context.params);
    const input = validateInput(
      productVariantCreateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await createProductVariant(params.id, input), {
      status: 201,
    });
  } catch (error) {
    return apiError(error);
  }
}

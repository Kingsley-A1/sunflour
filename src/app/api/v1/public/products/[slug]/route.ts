import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import { slugParamSchema } from "@/server/modules/menu/catalog-schemas";
import { getPublicProductBySlug } from "@/server/modules/menu/catalog-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ProductRouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: ProductRouteContext) {
  try {
    const params = validateInput(slugParamSchema, await context.params);

    return apiSuccess(await getPublicProductBySlug(params.slug));
  } catch (error) {
    return apiError(error);
  }
}

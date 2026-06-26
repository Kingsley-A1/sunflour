import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import {
  deleteProductDraft,
  getProductDraft,
  productDraftIdParamSchema,
  productDraftInputSchema,
  updateProductDraft,
} from "@/server/modules/menu";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const { id } = validateInput(
      productDraftIdParamSchema,
      await context.params,
    );

    return apiSuccess({ draft: await getProductDraft(id, actor) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    enforceRateLimit({
      key: `product-draft-write:${actor.id}`,
      limit: 300,
      windowMs: 15 * 60_000,
    });
    const { id } = validateInput(
      productDraftIdParamSchema,
      await context.params,
    );
    const input = validateInput(
      productDraftInputSchema,
      await readJsonBody(request),
    );

    return apiSuccess({ draft: await updateProductDraft(id, input, actor) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const { id } = validateInput(
      productDraftIdParamSchema,
      await context.params,
    );

    return apiSuccess(await deleteProductDraft(id, actor));
  } catch (error) {
    return apiError(error);
  }
}

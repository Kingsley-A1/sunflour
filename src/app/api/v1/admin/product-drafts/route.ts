import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import {
  createProductDraft,
  listProductDrafts,
  productDraftInputSchema,
} from "@/server/modules/menu";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);

    return apiSuccess({ drafts: await listProductDrafts(actor) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    enforceRateLimit({
      key: `product-draft-write:${actor.id}`,
      limit: 300,
      windowMs: 15 * 60_000,
    });
    const input = validateInput(
      productDraftInputSchema,
      await readJsonBody(request),
    );

    return apiSuccess({ draft: await createProductDraft(input, actor) }, {
      status: 201,
    });
  } catch (error) {
    return apiError(error);
  }
}

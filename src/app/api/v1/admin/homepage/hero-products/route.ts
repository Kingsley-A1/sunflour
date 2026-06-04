import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES, SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import { homepageHeroProductUpdateSchema } from "@/server/modules/menu/catalog-schemas";
import {
  listAdminHomepageHeroProducts,
  updateHomepageHeroProducts,
} from "@/server/modules/menu/homepage-hero-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(ADMIN_ROLES);

    return apiSuccess({
      heroProducts: await listAdminHomepageHeroProducts(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const input = validateInput(
      homepageHeroProductUpdateSchema,
      await readJsonBody(request),
    );

    return apiSuccess({
      heroProducts: await updateHomepageHeroProducts(input, actor),
    });
  } catch (error) {
    return apiError(error);
  }
}

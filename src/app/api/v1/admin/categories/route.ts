import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES, SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  categoryCreateSchema,
} from "@/server/modules/menu/catalog-schemas";
import {
  createCategory,
  listAdminCategories,
} from "@/server/modules/menu/catalog-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(ADMIN_ROLES);

    return apiSuccess({
      categories: await listAdminCategories(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const input = validateInput(categoryCreateSchema, await readJsonBody(request));

    return apiSuccess(await createCategory(input, actor), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

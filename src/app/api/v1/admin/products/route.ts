import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES, SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import { productCreateSchema } from "@/server/modules/menu/catalog-schemas";
import {
  createProduct,
  listAdminProducts,
} from "@/server/modules/menu/catalog-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(ADMIN_ROLES);

    return apiSuccess({
      products: await listAdminProducts(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(SUPER_ADMIN_ROLES);
    const input = validateInput(productCreateSchema, await readJsonBody(request));

    return apiSuccess(await createProduct(input), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

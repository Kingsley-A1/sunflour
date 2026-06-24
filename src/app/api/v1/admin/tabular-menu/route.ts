import { revalidatePath } from "next/cache";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";
import { requireRole } from "@/server/auth/rbac";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  getTabularMenuContentForAdmin,
  tabularMenuContentUpdateSchema,
  updateTabularMenuContent,
} from "@/server/modules/menu";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeRevalidateTabularMenuViews() {
  try {
    revalidatePath("/menu");
  } catch {
    // Revalidation is unavailable in isolated unit tests.
  }
}

export async function GET() {
  try {
    await requireRole(PRODUCT_CONTENT_ROLES);

    return apiSuccess({
      tabularMenu: await getTabularMenuContentForAdmin(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole(PRODUCT_CONTENT_ROLES);
    const input = validateInput(
      tabularMenuContentUpdateSchema,
      await readJsonBody(request),
    );
    const tabularMenu = await updateTabularMenuContent(input, actor);

    safeRevalidateTabularMenuViews();

    return apiSuccess({ tabularMenu });
  } catch (error) {
    return apiError(error);
  }
}

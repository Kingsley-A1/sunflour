import { revalidatePath } from "next/cache";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";
import { requireRole } from "@/server/auth/rbac";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  getMenuBoardsForAdmin,
  menuBoardsUpdateSchema,
  updateMenuBoards,
} from "@/server/modules/menu";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeRevalidateMenu() {
  try {
    revalidatePath("/menu");
  } catch {
    // Revalidation is unavailable in isolated unit tests.
  }
}

export async function GET() {
  try {
    await requireRole(PRODUCT_CONTENT_ROLES);

    return apiSuccess({ menuBoards: await getMenuBoardsForAdmin() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole(PRODUCT_CONTENT_ROLES);
    const input = validateInput(
      menuBoardsUpdateSchema,
      await readJsonBody(request),
    );
    const menuBoards = await updateMenuBoards(input, actor);

    safeRevalidateMenu();

    return apiSuccess({ menuBoards });
  } catch (error) {
    return apiError(error);
  }
}

import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  businessSettingsUpdateSchema,
  getBusinessSettingsForAdmin,
  updateBusinessSettings,
} from "@/server/modules/settings";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeRevalidatePublicSettingsViews() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/contact");
    revalidatePath("/about");
  } catch {
    // Revalidation is unavailable in isolated unit tests.
  }
}

export async function GET() {
  try {
    await requireRole(SUPER_ADMIN_ROLES);

    return apiSuccess({
      businessSettings: await getBusinessSettingsForAdmin(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const input = validateInput(
      businessSettingsUpdateSchema,
      await readJsonBody(request),
    );
    const businessSettings = await updateBusinessSettings(input, actor);

    safeRevalidatePublicSettingsViews();

    return apiSuccess({ businessSettings });
  } catch (error) {
    return apiError(error);
  }
}

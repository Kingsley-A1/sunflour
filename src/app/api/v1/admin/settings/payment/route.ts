import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  getPaymentSettingsForAdmin,
  updatePaymentSettings,
} from "@/server/modules/payments/payment-service";
import { paymentSettingsUpdateSchema } from "@/server/modules/payments/payment-schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(SUPER_ADMIN_ROLES);

    return apiSuccess({
      paymentSettings: await getPaymentSettingsForAdmin(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(SUPER_ADMIN_ROLES);
    const input = validateInput(
      paymentSettingsUpdateSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await updatePaymentSettings(input, user));
  } catch (error) {
    return apiError(error);
  }
}

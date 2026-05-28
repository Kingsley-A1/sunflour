import { requireAuth } from "@/server/auth/rbac";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  customerProfileUpdateSchema,
  getCustomerProfile,
  updateCustomerProfile,
} from "@/server/modules/customers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuth();

    return apiSuccess({
      profile: await getCustomerProfile(user),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const input = validateInput(
      customerProfileUpdateSchema,
      await readJsonBody(request),
    );

    return apiSuccess({
      profile: await updateCustomerProfile(input, user),
    });
  } catch (error) {
    return apiError(error);
  }
}

import { requireAuth } from "@/server/auth/rbac";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  customerOrderNumberParamSchema,
  getCustomerOrderDetail,
} from "@/server/modules/customers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CustomerOrderRouteContext {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(
  _request: Request,
  context: CustomerOrderRouteContext,
) {
  try {
    const user = await requireAuth();
    const params = validateInput(
      customerOrderNumberParamSchema,
      await context.params,
    );

    return apiSuccess(await getCustomerOrderDetail(params.orderNumber, user));
  } catch (error) {
    return apiError(error);
  }
}

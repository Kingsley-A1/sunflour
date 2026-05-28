import { requireAuth } from "@/server/auth/rbac";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  customerOrderListQuerySchema,
  listCustomerOrders,
} from "@/server/modules/customers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const searchParams = new URL(request.url).searchParams;
    const input = validateInput(customerOrderListQuerySchema, {
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    return apiSuccess(await listCustomerOrders(input, user));
  } catch (error) {
    return apiError(error);
  }
}

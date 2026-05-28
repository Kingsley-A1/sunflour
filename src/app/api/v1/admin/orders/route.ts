import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  adminOrderListQuerySchema,
  listAdminOrders,
} from "@/server/modules/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireRole(ADMIN_ROLES);
    const searchParams = new URL(request.url).searchParams;
    const input = validateInput(adminOrderListQuerySchema, {
      status: searchParams.get("status") ?? undefined,
      paymentStatus: searchParams.get("paymentStatus") ?? undefined,
      customerType: searchParams.get("customerType") ?? undefined,
      orderNumber: searchParams.get("orderNumber") ?? undefined,
      customerPhone: searchParams.get("customerPhone") ?? undefined,
      createdFrom: searchParams.get("createdFrom") ?? undefined,
      createdTo: searchParams.get("createdTo") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    return apiSuccess(await listAdminOrders(input));
  } catch (error) {
    return apiError(error);
  }
}

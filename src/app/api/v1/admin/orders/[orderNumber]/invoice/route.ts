import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  getAdminInvoice,
  invoiceOrderNumberParamSchema,
} from "@/server/modules/invoices";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AdminInvoiceRouteContext {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(
  _request: Request,
  context: AdminInvoiceRouteContext,
) {
  try {
    await requireRole(ADMIN_ROLES);
    const params = validateInput(
      invoiceOrderNumberParamSchema,
      await context.params,
    );

    return apiSuccess(await getAdminInvoice(params.orderNumber));
  } catch (error) {
    return apiError(error);
  }
}

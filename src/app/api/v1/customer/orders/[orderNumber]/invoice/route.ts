import { requireAuth } from "@/server/auth/rbac";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  getCustomerInvoice,
  invoiceOrderNumberParamSchema,
} from "@/server/modules/invoices";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CustomerInvoiceRouteContext {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(
  _request: Request,
  context: CustomerInvoiceRouteContext,
) {
  try {
    const user = await requireAuth();
    const params = validateInput(
      invoiceOrderNumberParamSchema,
      await context.params,
    );

    return apiSuccess(await getCustomerInvoice(params.orderNumber, user));
  } catch (error) {
    return apiError(error);
  }
}

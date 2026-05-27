import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  getPublicInvoice,
  invoiceOrderNumberParamSchema,
  publicInvoiceQuerySchema,
} from "@/server/modules/invoices";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicInvoiceRouteContext {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(request: Request, context: PublicInvoiceRouteContext) {
  try {
    const params = validateInput(
      invoiceOrderNumberParamSchema,
      await context.params,
    );
    const query = validateInput(
      publicInvoiceQuerySchema,
      Object.fromEntries(new URL(request.url).searchParams),
    );

    return apiSuccess(await getPublicInvoice(params.orderNumber, query.token));
  } catch (error) {
    return apiError(error);
  }
}

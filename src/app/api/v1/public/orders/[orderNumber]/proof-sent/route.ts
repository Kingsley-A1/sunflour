import { getClientIp, readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import {
  orderNumberParamSchema,
  publicProofHandoffSchema,
  recordCustomerProofSent,
} from "@/server/modules/payments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ orderNumber: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    enforceRateLimit({
      key: `order-proof-sent:${getClientIp(request)}`,
      limit: 20,
      windowMs: 15 * 60_000,
    });

    const { orderNumber } = validateInput(
      orderNumberParamSchema,
      await context.params,
    );
    const { token } = validateInput(
      publicProofHandoffSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await recordCustomerProofSent(orderNumber, token));
  } catch (error) {
    return apiError(error);
  }
}

import { getOptionalAuth } from "@/server/auth/rbac";
import { getClientIp, readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import {
  checkoutCreateSchema,
  checkoutHeadersSchema,
} from "@/server/modules/checkout/checkout-schemas";
import { createCheckoutOrder } from "@/server/modules/checkout/checkout-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `checkout:${getClientIp(request)}`,
      limit: 20,
      windowMs: 15 * 60_000,
    });

    const headers = validateInput(checkoutHeadersSchema, {
      idempotencyKey: request.headers.get("Idempotency-Key"),
    });
    const input = validateInput(checkoutCreateSchema, await readJsonBody(request));
    const user = await getOptionalAuth();

    return apiSuccess(
      await createCheckoutOrder(input, {
        idempotencyKey: headers.idempotencyKey,
        user,
      }),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

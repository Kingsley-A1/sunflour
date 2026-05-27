import { getOptionalAuth } from "@/server/auth/rbac";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
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

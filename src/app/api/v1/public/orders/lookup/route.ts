import { getClientIp, readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import {
  guestOrderLookupSchema,
  lookupGuestOrder,
} from "@/server/modules/customers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `guest-order-lookup:${getClientIp(request)}`,
      limit: 10,
      windowMs: 15 * 60_000,
    });

    const input = validateInput(
      guestOrderLookupSchema,
      await readJsonBody(request),
    );

    return apiSuccess({
      order: await lookupGuestOrder(input),
    });
  } catch (error) {
    return apiError(error);
  }
}

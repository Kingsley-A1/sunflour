import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import { deliveryQuoteRequestSchema } from "@/server/modules/delivery/delivery-schemas";
import { getDeliveryQuote } from "@/server/modules/delivery/delivery-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = validateInput(
      deliveryQuoteRequestSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await getDeliveryQuote(input));
  } catch (error) {
    return apiError(error);
  }
}

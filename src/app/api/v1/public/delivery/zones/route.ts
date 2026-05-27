import { apiError, apiSuccess } from "@/server/lib/api/response";
import { listPublicDeliveryZones } from "@/server/modules/delivery/delivery-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return apiSuccess(await listPublicDeliveryZones());
  } catch (error) {
    return apiError(error);
  }
}

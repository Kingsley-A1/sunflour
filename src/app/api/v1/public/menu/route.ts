import { getPublicMenu } from "@/server/modules/menu/catalog-service";
import { apiError, apiSuccess } from "@/server/lib/api/response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return apiSuccess(await getPublicMenu());
  } catch (error) {
    return apiError(error);
  }
}

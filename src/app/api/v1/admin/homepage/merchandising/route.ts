import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  getHomepageMerchandisingForAdmin,
  homepageCarouselUpdateSchema,
  updateHomepageCarousel,
  updateWeeklySale,
  weeklySaleUpdateSchema,
} from "@/server/modules/homepage-merchandising";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(PRODUCT_CONTENT_ROLES);
    return apiSuccess({
      merchandising: await getHomepageMerchandisingForAdmin(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole(PRODUCT_CONTENT_ROLES);
    const body = await readJsonBody(request);
    const carouselResult = homepageCarouselUpdateSchema.safeParse(body);

    if (carouselResult.success) {
      return apiSuccess({
        carousel: await updateHomepageCarousel(carouselResult.data, actor),
      });
    }

    const weeklySale = validateInput(weeklySaleUpdateSchema, body);
    return apiSuccess({
      weeklySale: await updateWeeklySale(weeklySale, actor),
    });
  } catch (error) {
    return apiError(error);
  }
}

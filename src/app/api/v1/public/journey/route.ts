import { getOptionalAuth } from "@/server/auth/rbac";
import { isAdminRole } from "@/server/auth/roles";
import { getClientIp, readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import {
  recordSiteEvents,
  siteEventBatchSchema,
} from "@/server/modules/analytics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Anonymous storefront journey events (page views, add to cart, checkout
 * steps). Named "journey" rather than "analytics" so common content blockers
 * don't silently drop first-party measurement.
 */
export async function POST(request: Request) {
  try {
    // The IP is used only for this limit and is never stored.
    enforceRateLimit({
      key: `journey:${getClientIp(request)}`,
      limit: 90,
      windowMs: 60_000,
    });

    const input = validateInput(siteEventBatchSchema, await readJsonBody(request));
    const user = await getOptionalAuth().catch(() => null);
    const result = await recordSiteEvents(input, {
      userAgent: request.headers.get("user-agent"),
      siteHost: request.headers.get("host"),
      isStaff: Boolean(user && isAdminRole(user.role)),
    });

    return apiSuccess(result, { status: 202 });
  } catch (error) {
    return apiError(error);
  }
}

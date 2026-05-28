import { getServerEnv } from "@/server/config/env";
import { getClientIp } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { processEmailOutbox } from "@/server/modules/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requireCronSecret(request: Request): void {
  const env = getServerEnv();
  const configuredSecret = env.EMAIL_CRON_SECRET;
  const authorization = request.headers.get("authorization");
  const bearerSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  const headerSecret = request.headers.get("x-cron-secret");

  if (
    !configuredSecret ||
    (bearerSecret !== configuredSecret && headerSecret !== configuredSecret)
  ) {
    throw new AppError({
      code: ERROR_CODES.FORBIDDEN,
      publicMessage: "Cron email processing is not authorized.",
      status: 403,
    });
  }
}

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `email-cron:${getClientIp(request)}`,
      limit: 60,
      windowMs: 60 * 60_000,
    });
    requireCronSecret(request);

    return apiSuccess(await processEmailOutbox());
  } catch (error) {
    return apiError(error);
  }
}

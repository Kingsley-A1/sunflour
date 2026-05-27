import { getServerEnv } from "@/server/config/env";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
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
    requireCronSecret(request);

    return apiSuccess(await processEmailOutbox());
  } catch (error) {
    return apiError(error);
  }
}

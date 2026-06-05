import { getClientIp, readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import { passwordResetRequestSchema } from "@/server/auth/auth-schemas";
import { requestPasswordReset } from "@/server/auth/password-reset-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `password-reset-request:${getClientIp(request)}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    const input = validateInput(
      passwordResetRequestSchema,
      await readJsonBody(request),
    );

    await requestPasswordReset(input, new URL(request.url).origin);

    return apiSuccess({
      message:
        "If an account exists for that email, a password reset link will be sent.",
    });
  } catch (error) {
    return apiError(error);
  }
}

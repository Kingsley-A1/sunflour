import { getClientIp, readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import { passwordResetConfirmSchema } from "@/server/auth/auth-schemas";
import { confirmPasswordReset } from "@/server/auth/password-reset-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `password-reset-confirm:${getClientIp(request)}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    const input = validateInput(
      passwordResetConfirmSchema,
      await readJsonBody(request),
    );

    await confirmPasswordReset(input);

    return apiSuccess({
      message: "Password updated. Sign in with your new password.",
    });
  } catch (error) {
    return apiError(error);
  }
}

import { getClientIp, readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import { adminRegistrationSchema } from "@/server/auth/auth-schemas";
import { registerAdmin } from "@/server/auth/registration-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `admin-register:${getClientIp(request)}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    const input = validateInput(
      adminRegistrationSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await registerAdmin(input), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

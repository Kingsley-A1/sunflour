import { getClientIp, readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { enforceRateLimit } from "@/server/lib/rate-limit";
import { validateInput } from "@/server/lib/validation/zod";
import { customerRegistrationSchema } from "@/server/auth/auth-schemas";
import { registerCustomer } from "@/server/auth/registration-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `auth-register:${getClientIp(request)}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });

    const input = validateInput(
      customerRegistrationSchema,
      await readJsonBody(request),
    );

    return apiSuccess(
      {
        user: await registerCustomer(input),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

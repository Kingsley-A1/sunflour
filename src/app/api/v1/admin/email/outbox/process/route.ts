import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { requireRole } from "@/server/auth/rbac";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  emailOutboxProcessSchema,
  processEmailOutbox,
} from "@/server/modules/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireRole(SUPER_ADMIN_ROLES);
    const input = validateInput(
      emailOutboxProcessSchema,
      await readJsonBody(request),
    );

    return apiSuccess(await processEmailOutbox(input));
  } catch (error) {
    return apiError(error);
  }
}

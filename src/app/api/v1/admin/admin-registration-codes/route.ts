import { z } from "zod";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  getAdminRegistrationCodePanel,
  rotateAdminRegistrationCodes,
} from "@/server/auth/admin-registration-code-service";

const rotateAdminRegistrationCodesSchema = z
  .object({
    confirmation: z.literal("ROTATE_ADMIN_REGISTRATION_CODES"),
  })
  .strict();

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(SUPER_ADMIN_ROLES);

    return apiSuccess({
      registrationCodes: await getAdminRegistrationCodePanel(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    validateInput(
      rotateAdminRegistrationCodesSchema,
      await readJsonBody(request),
    );

    return apiSuccess({
      registrationCodes: await rotateAdminRegistrationCodes(actor),
    });
  } catch (error) {
    return apiError(error);
  }
}

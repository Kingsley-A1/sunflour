import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import { writeAuditLog } from "@/server/modules/audit/audit-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const paymentSettingsGuardSchema = z
  .object({
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(SUPER_ADMIN_ROLES);
    const input = validateInput(
      paymentSettingsGuardSchema,
      await readJsonBody(request),
    );

    await writeAuditLog({
      actorUserId: user.id,
      action: "PAYMENT_SETTINGS_ACCESS_VERIFIED",
      targetType: "payment_settings",
      targetId: null,
      metadata: {
        reason: input.reason ?? null,
        phase: "auth-rbac-foundation",
      },
    });

    return apiSuccess({
      status: "authorized",
      role: user.role,
      message: "Payment settings mutations are restricted to super admins.",
    });
  } catch (error) {
    return apiError(error);
  }
}

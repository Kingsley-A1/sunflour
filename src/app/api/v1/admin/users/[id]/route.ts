import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";
import {
  deleteUserAccount,
  listAdminUsersForSuperAdmin,
  listCustomerUsersForSuperAdmin,
  reactivateUserAccount,
  suspendUserAccount,
  userDeleteSchema,
  userIdParamSchema,
  userStatusActionSchema,
} from "@/server/modules/admin/admin-users-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AdminUserRouteContext {
  params: Promise<{ id: string }>;
}

async function currentLists() {
  return {
    adminUsers: await listAdminUsersForSuperAdmin(),
    customerUsers: await listCustomerUsersForSuperAdmin(),
  };
}

export async function PATCH(
  request: Request,
  context: AdminUserRouteContext,
) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const { id } = validateInput(userIdParamSchema, await context.params);
    const input = validateInput(
      userStatusActionSchema,
      await readJsonBody(request),
    );

    const result =
      input.action === "suspend"
        ? await suspendUserAccount(actor, id, input.reason)
        : await reactivateUserAccount(actor, id);

    return apiSuccess({ result, ...(await currentLists()) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: AdminUserRouteContext,
) {
  try {
    const actor = await requireRole(SUPER_ADMIN_ROLES);
    const { id } = validateInput(userIdParamSchema, await context.params);
    const body = await readJsonBody(request).catch(() => ({}));
    const input = validateInput(userDeleteSchema, body ?? {});

    const result = await deleteUserAccount(actor, id, input.reason);

    return apiSuccess({ result, ...(await currentLists()) });
  } catch (error) {
    return apiError(error);
  }
}

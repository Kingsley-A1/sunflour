import { AdminProfileStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";
import { getAdminAllowlistRoleForEmail } from "@/server/auth/admin-allowlist";
import { writeAuditLog } from "@/server/modules/audit/audit-service";

export interface ApplyAdminAllowlistRoleInput {
  userId: string;
  email: string | null | undefined;
}

export async function applyAdminAllowlistRole(
  input: ApplyAdminAllowlistRoleInput,
): Promise<void> {
  const role = getAdminAllowlistRoleForEmail(input.email);

  if (!role) {
    return;
  }

  await prisma.$transaction(async (transaction) => {
    const before = await transaction.adminProfile.findUnique({
      where: {
        userId: input.userId,
      },
      select: {
        role: true,
        status: true,
      },
    });

    await transaction.user.update({
      where: { id: input.userId },
      data: {
        role,
        adminProfile: {
          upsert: {
            create: {
              role,
              status: AdminProfileStatus.ACTIVE,
            },
            update: {
              role,
              status: AdminProfileStatus.ACTIVE,
            },
          },
        },
      },
    });

    await writeAuditLog(
      {
        actorUserId: null,
        action: "ADMIN_ALLOWLIST_PROVISIONED",
        targetType: "admin_profile",
        targetId: input.userId,
        metadata: {
          source: "ADMIN_ALLOWLIST_EMAILS",
          email: input.email,
          before,
          after: {
            role,
            status: AdminProfileStatus.ACTIVE,
          },
        },
      },
      transaction,
    );
  });
}

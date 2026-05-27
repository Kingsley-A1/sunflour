import { AdminProfileStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";
import { getAdminAllowlistRoleForEmail } from "@/server/auth/admin-allowlist";

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

  await prisma.user.update({
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
}

import { AdminProfileStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";
import { parseAdminAllowlist } from "@/server/auth/admin-allowlist";
import { writeAuditLog } from "@/server/modules/audit/audit-service";

export interface SeedAdminAllowlistResult {
  count: number;
  emails: string[];
}

export async function seedAdminAllowlist(
  rawAllowlist = process.env.ADMIN_ALLOWLIST_EMAILS ?? "",
): Promise<SeedAdminAllowlistResult> {
  const entries = parseAdminAllowlist(rawAllowlist);

  for (const entry of entries) {
    const user = await prisma.user.upsert({
      where: { email: entry.email },
      update: {
        role: entry.role,
      },
      create: {
        email: entry.email,
        role: entry.role,
      },
      select: {
        id: true,
      },
    });

    await prisma.adminProfile.upsert({
      where: { userId: user.id },
      update: {
        role: entry.role,
        status: AdminProfileStatus.ACTIVE,
      },
      create: {
        userId: user.id,
        role: entry.role,
        status: AdminProfileStatus.ACTIVE,
      },
    });

    await writeAuditLog({
      actorUserId: null,
      action: "ADMIN_ALLOWLIST_SEEDED",
      targetType: "admin_profile",
      targetId: user.id,
      metadata: {
        email: entry.email,
        role: entry.role,
      },
    });
  }

  return {
    count: entries.length,
    emails: entries.map((entry) => entry.email),
  };
}

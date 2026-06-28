import { z } from "zod";
import { AdminProfileStatus, UserRole } from "@/generated/prisma/enums";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { getResolvedPublicContactConfig } from "@/server/config/public-contact";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import {
  queueAccountStatusNoticeEmail,
  type AccountStatusAction,
} from "@/server/modules/email";

// Suspension blocks sign-in by pushing lockedUntil far into the future. A normal
// failed-login lockout is only minutes long, so anything more than a year out is
// treated as a deliberate suspension.
const SUSPENSION_LOCK_UNTIL = new Date("9999-12-31T23:59:59.000Z");
const SUSPENSION_THRESHOLD_MS = 365 * 24 * 60 * 60 * 1000;

export function isAccountSuspended(lockedUntil: Date | null): boolean {
  return Boolean(
    lockedUntil && lockedUntil.getTime() > Date.now() + SUSPENSION_THRESHOLD_MS,
  );
}

export const userIdParamSchema = z.object({ id: z.string().min(1) }).strict();

export const userStatusActionSchema = z
  .object({
    action: z.enum(["suspend", "reactivate"]),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const userDeleteSchema = z
  .object({ reason: z.string().trim().max(500).optional() })
  .strict();

export type UserStatusActionInput = z.infer<typeof userStatusActionSchema>;
export type UserDeleteInput = z.infer<typeof userDeleteSchema>;

interface TargetUser {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  lockedUntil: Date | null;
  adminProfile: { status: AdminProfileStatus } | null;
}

function notFound(): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: "User account not found.",
    status: 404,
  });
}

function forbidden(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.FORBIDDEN,
    publicMessage: message,
    status: 403,
  });
}

function conflict(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.CONFLICT,
    publicMessage: message,
    status: 409,
  });
}

export async function listAdminUsersForSuperAdmin() {
  return prisma.adminProfile.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLoginAt: true,
          lockedUntil: true,
        },
      },
    },
  });
}

export async function listCustomerUsersForSuperAdmin(limit = 100) {
  return prisma.user.findMany({
    where: { role: UserRole.CUSTOMER },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      lastLoginAt: true,
      lockedUntil: true,
      createdAt: true,
    },
  });
}

async function loadTarget(targetUserId: string): Promise<TargetUser> {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lockedUntil: true,
      adminProfile: { select: { status: true } },
    },
  });

  if (!user) {
    throw notFound();
  }

  return user;
}

async function ensureNotLastActiveSuperAdmin(target: TargetUser): Promise<void> {
  if (target.role !== UserRole.SUPER_ADMIN) {
    return;
  }

  const otherActiveSuperAdmins = await prisma.adminProfile.count({
    where: {
      role: UserRole.SUPER_ADMIN,
      status: AdminProfileStatus.ACTIVE,
      userId: { not: target.id },
    },
  });

  if (otherActiveSuperAdmins === 0) {
    throw conflict(
      "You cannot suspend or remove the last active super admin. Promote another super admin first.",
    );
  }
}

async function notifyAccountStatus(
  target: Pick<TargetUser, "email" | "name">,
  action: AccountStatusAction,
  reason?: string | null,
): Promise<void> {
  // Email must never break the action itself.
  try {
    const contact = await getResolvedPublicContactConfig();

    await queueAccountStatusNoticeEmail({
      recipientEmail: target.email,
      recipientName: target.name,
      action,
      reason: reason ?? null,
      businessName: contact.businessName,
      supportEmail: contact.emailAddress,
      supportPhone: contact.phoneNumber,
    });
  } catch {
    // Swallow: a failed notification should not roll back a suspension/deletion.
  }
}

export async function suspendUserAccount(
  actor: AuthenticatedUser,
  targetUserId: string,
  reason?: string | null,
) {
  const target = await loadTarget(targetUserId);

  if (target.id === actor.id) {
    throw forbidden("You cannot suspend your own account.");
  }

  await ensureNotLastActiveSuperAdmin(target);

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: target.id },
      data: { lockedUntil: SUSPENSION_LOCK_UNTIL },
    });

    if (target.adminProfile) {
      await transaction.adminProfile.update({
        where: { userId: target.id },
        data: { status: AdminProfileStatus.SUSPENDED },
      });
    }

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "ADMIN_USER_SUSPENDED",
        targetType: "user",
        targetId: target.id,
        metadata: { role: target.role, reason: reason ?? null },
      },
      transaction,
    );
  });

  await notifyAccountStatus(target, "SUSPENDED", reason);

  return { id: target.id, action: "SUSPENDED" as const };
}

export async function reactivateUserAccount(
  actor: AuthenticatedUser,
  targetUserId: string,
) {
  const target = await loadTarget(targetUserId);

  if (target.id === actor.id) {
    throw forbidden("You cannot change your own account status.");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: target.id },
      data: { lockedUntil: null, failedLoginCount: 0 },
    });

    if (target.adminProfile) {
      await transaction.adminProfile.update({
        where: { userId: target.id },
        data: { status: AdminProfileStatus.ACTIVE },
      });
    }

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "ADMIN_USER_REACTIVATED",
        targetType: "user",
        targetId: target.id,
        metadata: { role: target.role },
      },
      transaction,
    );
  });

  await notifyAccountStatus(target, "REACTIVATED");

  return { id: target.id, action: "REACTIVATED" as const };
}

export async function deleteUserAccount(
  actor: AuthenticatedUser,
  targetUserId: string,
  reason?: string | null,
) {
  const target = await loadTarget(targetUserId);

  if (target.id === actor.id) {
    throw forbidden("You cannot delete your own account.");
  }

  await ensureNotLastActiveSuperAdmin(target);

  await prisma.$transaction(async (transaction) => {
    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "ADMIN_USER_DELETED",
        targetType: "user",
        targetId: target.id,
        metadata: { role: target.role, email: target.email, reason: reason ?? null },
      },
      transaction,
    );

    // Orders keep their snapshots (Order.userId is ON DELETE SET NULL); auth,
    // profile, cart, and draft records cascade away.
    await transaction.user.delete({ where: { id: target.id } });
  });

  await notifyAccountStatus(
    { email: target.email, name: target.name },
    "REMOVED",
    reason,
  );

  return { id: target.id, action: "REMOVED" as const };
}

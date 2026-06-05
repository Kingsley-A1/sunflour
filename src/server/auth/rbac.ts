import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { AdminProfileStatus } from "@/generated/prisma/enums";
import { authOptions } from "@/server/auth/options";
import { UserRole, isAdminRole, isRoleAllowed } from "@/server/auth/roles";
import type { Role } from "@/server/auth/roles";
import { prisma } from "@/server/db/prisma";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { AppError } from "@/server/lib/errors/app-error";

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role: Role;
}

export interface AdminAuthorizationRecord {
  role: Role;
  status: AdminProfileStatus;
}

export type SessionGetter = () => Promise<Session | null>;
export type AdminAuthorizationLookup = (
  userId: string,
) => Promise<AdminAuthorizationRecord | null>;

export interface AuthCheckOptions {
  getSession?: SessionGetter;
  getAdminAuthorization?: AdminAuthorizationLookup;
}

function unauthorized(): AppError {
  return new AppError({
    code: ERROR_CODES.UNAUTHORIZED,
    publicMessage: "Sign in to continue.",
    status: 401,
  });
}

function forbidden(): AppError {
  return new AppError({
    code: ERROR_CODES.FORBIDDEN,
    publicMessage: "You do not have permission to perform this action.",
    status: 403,
  });
}

async function getDefaultSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

async function getDefaultAdminAuthorization(
  userId: string,
): Promise<AdminAuthorizationRecord | null> {
  return prisma.adminProfile.findUnique({
    where: { userId },
    select: {
      role: true,
      status: true,
    },
  });
}

export async function requireAuth(
  options: AuthCheckOptions = {},
): Promise<AuthenticatedUser> {
  const getSession = options.getSession ?? getDefaultSession;
  const session = await getSession();

  if (!session?.user?.id) {
    throw unauthorized();
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    role: session.user.role ?? UserRole.CUSTOMER,
  };
}

export async function getOptionalAuth(
  options: AuthCheckOptions = {},
): Promise<AuthenticatedUser | null> {
  const getSession = options.getSession ?? getDefaultSession;
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    role: session.user.role ?? UserRole.CUSTOMER,
  };
}

export async function requireRole(
  allowedRoles: readonly Role[],
  options: AuthCheckOptions = {},
): Promise<AuthenticatedUser> {
  const user = await requireAuth(options);

  const requiresAdminProfile = allowedRoles.some(isAdminRole);

  if (!requiresAdminProfile && isRoleAllowed(user.role, allowedRoles)) {
    return user;
  }

  if (!requiresAdminProfile) {
    throw forbidden();
  }

  const getAdminAuthorization =
    options.getAdminAuthorization ?? getDefaultAdminAuthorization;
  const adminAuthorization = await getAdminAuthorization(user.id);

  if (
    !adminAuthorization ||
    adminAuthorization.status !== AdminProfileStatus.ACTIVE ||
    !isRoleAllowed(adminAuthorization.role, allowedRoles)
  ) {
    throw forbidden();
  }

  return {
    ...user,
    role: adminAuthorization.role,
  };
}

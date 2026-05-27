import { UserRole } from "@/generated/prisma/enums";
import type { UserRole as UserRoleValue } from "@/generated/prisma/enums";

export { UserRole };
export type Role = UserRoleValue;
export type AdminRole = typeof UserRole.MODERATOR | typeof UserRole.SUPER_ADMIN;

export const ADMIN_ROLES = [
  UserRole.MODERATOR,
  UserRole.SUPER_ADMIN,
] as const satisfies readonly AdminRole[];

export const SUPER_ADMIN_ROLES = [
  UserRole.SUPER_ADMIN,
] as const satisfies readonly AdminRole[];

export function isAdminRole(role: Role): role is AdminRole {
  return role === UserRole.MODERATOR || role === UserRole.SUPER_ADMIN;
}

export function isRoleAllowed(
  role: Role,
  allowedRoles: readonly Role[],
): boolean {
  return allowedRoles.includes(role);
}

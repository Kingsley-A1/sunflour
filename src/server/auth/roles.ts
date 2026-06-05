import { UserRole } from "@/generated/prisma/enums";
import type { UserRole as UserRoleValue } from "@/generated/prisma/enums";

export { UserRole };
export type Role = UserRoleValue;
export type AdminRole =
  | typeof UserRole.ATTENDANT
  | typeof UserRole.MEDIA_MANAGER
  | typeof UserRole.MODERATOR
  | typeof UserRole.SUPER_ADMIN;

export const ADMIN_ROLES = [
  UserRole.ATTENDANT,
  UserRole.MEDIA_MANAGER,
  UserRole.MODERATOR,
  UserRole.SUPER_ADMIN,
] as const satisfies readonly AdminRole[];

export const SUPER_ADMIN_ROLES = [
  UserRole.SUPER_ADMIN,
] as const satisfies readonly AdminRole[];

export const ORDER_ADMIN_ROLES = [
  UserRole.ATTENDANT,
  UserRole.MODERATOR,
  UserRole.SUPER_ADMIN,
] as const satisfies readonly AdminRole[];

export const PRODUCT_ADMIN_ROLES = [
  UserRole.MEDIA_MANAGER,
  UserRole.MODERATOR,
  UserRole.SUPER_ADMIN,
] as const satisfies readonly AdminRole[];

export const PRODUCT_CONTENT_ROLES = [
  UserRole.MEDIA_MANAGER,
  UserRole.SUPER_ADMIN,
] as const satisfies readonly AdminRole[];

export const PRODUCT_AVAILABILITY_ROLES = [
  UserRole.MODERATOR,
  UserRole.SUPER_ADMIN,
] as const satisfies readonly AdminRole[];

export const REVIEW_ADMIN_ROLES = [
  UserRole.MODERATOR,
  UserRole.SUPER_ADMIN,
] as const satisfies readonly AdminRole[];

export function isAdminRole(role: Role): role is AdminRole {
  return (
    role === UserRole.ATTENDANT ||
    role === UserRole.MEDIA_MANAGER ||
    role === UserRole.MODERATOR ||
    role === UserRole.SUPER_ADMIN
  );
}

export function isRoleAllowed(
  role: Role,
  allowedRoles: readonly Role[],
): boolean {
  return allowedRoles.includes(role);
}

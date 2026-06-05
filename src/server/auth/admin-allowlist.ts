import { z } from "zod";
import { UserRole } from "@/server/auth/roles";
import type { AdminRole } from "@/server/auth/roles";

export interface AdminAllowlistEntry {
  email: string;
  role: AdminRole;
}

const adminRoleSchema = z.enum([
  UserRole.ATTENDANT,
  UserRole.MEDIA_MANAGER,
  UserRole.MODERATOR,
  UserRole.SUPER_ADMIN,
]);

const emailSchema = z.string().trim().toLowerCase().email();

export function normalizeEmail(email: string): string {
  return emailSchema.parse(email);
}

export function parseAdminAllowlist(
  rawAllowlist = process.env.ADMIN_ALLOWLIST_EMAILS ?? "",
): AdminAllowlistEntry[] {
  const rawEntries = rawAllowlist
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return rawEntries.map((entry) => {
    const [rawEmail, rawRole, ...extraParts] = entry.split(":");

    if (!rawEmail || !rawRole || extraParts.length > 0) {
      throw new Error(
        "ADMIN_ALLOWLIST_EMAILS entries must use email:ROLE format.",
      );
    }

    return {
      email: normalizeEmail(rawEmail),
      role: adminRoleSchema.parse(rawRole.trim().toUpperCase()),
    };
  });
}

export function getAdminAllowlistRoleForEmail(
  email: string | null | undefined,
  rawAllowlist = process.env.ADMIN_ALLOWLIST_EMAILS ?? "",
): AdminRole | null {
  if (!email) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);

  return (
    parseAdminAllowlist(rawAllowlist).find(
      (entry) => entry.email === normalizedEmail,
    )?.role ?? null
  );
}

import "dotenv/config";

import {
  generateAdminRegistrationCode,
  getAdminRegistrationWindow,
} from "@/server/auth/admin-registration-codes";
import type { AdminRole } from "@/server/auth/roles";
import { UserRole } from "@/server/auth/roles";
import { getServerEnv } from "@/server/config/env";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const roles: Array<{ role: AdminRole; label: string }> = [
  { role: UserRole.SUPER_ADMIN, label: "Founder / super admin" },
  { role: UserRole.MODERATOR, label: "Manager / moderator" },
  { role: UserRole.ATTENDANT, label: "Supervisor / attendant" },
  { role: UserRole.MEDIA_MANAGER, label: "Media manager" },
];

const env = getServerEnv();
const secret = env.ADMIN_REGISTRATION_CODE_SECRET;

if (!secret) {
  throw new Error("ADMIN_REGISTRATION_CODE_SECRET is required.");
}

const now = new Date();
const window = getAdminRegistrationWindow(now);
const expiresAt = new Date((window + 1) * WEEK_MS);

console.log("Sunflour admin registration codes");
console.log(`Window: ${window}`);
console.log(`Expires: ${expiresAt.toISOString()}`);

for (const item of roles) {
  const code = generateAdminRegistrationCode({
    role: item.role,
    secret,
    date: now,
  });

  console.log(`${item.label}: ${code}`);
}

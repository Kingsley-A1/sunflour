import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/server/config/env";
import type { AdminRole } from "@/server/auth/roles";

const CODE_MODULUS = 1_000_000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getAdminRegistrationWindow(date = new Date()): number {
  return Math.floor(date.getTime() / WEEK_MS);
}

export function generateAdminRegistrationCode(input: {
  role: AdminRole;
  secret: string;
  rotationNonce?: string;
  date?: Date;
}): string {
  const window = getAdminRegistrationWindow(input.date);
  const rotationScope = input.rotationNonce ? `:${input.rotationNonce}` : "";
  const digest = createHmac("sha256", input.secret)
    .update(`sunflour-admin-registration:${input.role}:${window}${rotationScope}`)
    .digest();
  const numericCode = digest.readUInt32BE(0) % CODE_MODULUS;

  return numericCode.toString().padStart(6, "0");
}

export function verifyAdminRegistrationCode(input: {
  role: AdminRole;
  code: string;
  secret?: string;
  rotationNonce?: string;
  date?: Date;
}): boolean {
  const secret = input.secret ?? getServerEnv().ADMIN_REGISTRATION_CODE_SECRET;

  if (!secret) {
    return false;
  }

  const expected = generateAdminRegistrationCode({
    role: input.role,
    secret,
    rotationNonce: input.rotationNonce,
    date: input.date,
  });
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(input.code);

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import {
  generateAdminRegistrationCode,
  getAdminRegistrationWindow,
  verifyAdminRegistrationCode,
} from "@/server/auth/admin-registration-codes";
import type { AdminRole } from "@/server/auth/roles";
import { UserRole } from "@/server/auth/roles";
import { getServerEnv } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";

const SETTING_KEY = "admin_registration_code_rotation";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const rotationStateSchema = z
  .object({
    version: z.number().int().min(0),
    nonce: z.string(),
    rotatedAt: z.string().datetime({ offset: true }).nullable(),
    rotatedByUserId: z.string().nullable(),
  })
  .strict();

const adminRegistrationCodeRoles: Array<{
  role: AdminRole;
  label: string;
}> = [
  { role: UserRole.SUPER_ADMIN, label: "Founder / super admin" },
  { role: UserRole.MODERATOR, label: "Manager / moderator" },
  { role: UserRole.ATTENDANT, label: "Supervisor / attendant" },
  { role: UserRole.MEDIA_MANAGER, label: "Media manager" },
];

export type AdminRegistrationCodeRotationState = z.infer<
  typeof rotationStateSchema
>;

export interface AdminRegistrationCodePanel {
  version: number;
  window: number;
  expiresAt: string;
  generatedAt: string;
  rotatedAt: string | null;
  rotatedByUserId: string | null;
  codes: Array<{
    role: AdminRole;
    label: string;
    code: string;
  }>;
}

interface SiteSettingClient {
  siteSetting: {
    findUnique(input: {
      where: { key: string };
      select: { value: true };
    }): Promise<{ value: Prisma.JsonValue } | null>;
    upsert(input: {
      where: { key: string };
      create: { key: string; value: Prisma.InputJsonValue };
      update: { value?: Prisma.InputJsonValue };
      select: { value: true };
    }): Promise<{ value: Prisma.JsonValue }>;
  };
}

function defaultRotationState(): AdminRegistrationCodeRotationState {
  return {
    version: 0,
    nonce: "",
    rotatedAt: null,
    rotatedByUserId: null,
  };
}

function invalidRotationStateError(cause: unknown): AppError {
  return new AppError({
    code: ERROR_CODES.INTERNAL_ERROR,
    publicMessage: "Admin registration code settings are unavailable.",
    status: 500,
    cause,
  });
}

function parseRotationState(value: Prisma.JsonValue) {
  const result = rotationStateSchema.safeParse(value);

  if (!result.success) {
    throw invalidRotationStateError(result.error);
  }

  return result.data;
}

function createRotationNonce(): string {
  return randomBytes(32).toString("base64url");
}

function getAdminRegistrationCodeSecret(): string {
  const secret = getServerEnv().ADMIN_REGISTRATION_CODE_SECRET;

  if (!secret) {
    throw new AppError({
      code: ERROR_CODES.INTERNAL_ERROR,
      publicMessage: "Admin registration code secret is not configured.",
      status: 500,
    });
  }

  return secret;
}

export function getAdminRegistrationCodeExpiresAt(date = new Date()): Date {
  const window = getAdminRegistrationWindow(date);

  return new Date((window + 1) * WEEK_MS);
}

export function buildAdminRegistrationCodePanel(input: {
  state: AdminRegistrationCodeRotationState;
  secret: string;
  date?: Date;
}): AdminRegistrationCodePanel {
  const date = input.date ?? new Date();

  return {
    version: input.state.version,
    window: getAdminRegistrationWindow(date),
    expiresAt: getAdminRegistrationCodeExpiresAt(date).toISOString(),
    generatedAt: date.toISOString(),
    rotatedAt: input.state.rotatedAt,
    rotatedByUserId: input.state.rotatedByUserId,
    codes: adminRegistrationCodeRoles.map((item) => ({
      ...item,
      code: generateAdminRegistrationCode({
        role: item.role,
        secret: input.secret,
        rotationNonce: input.state.nonce,
        date,
      }),
    })),
  };
}

export async function getAdminRegistrationCodeRotationState(
  client: SiteSettingClient = prisma,
): Promise<AdminRegistrationCodeRotationState> {
  const setting = await client.siteSetting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: defaultRotationState(),
    },
    update: {},
    select: { value: true },
  });

  return parseRotationState(setting.value);
}

export async function getAdminRegistrationCodePanel(
  date = new Date(),
): Promise<AdminRegistrationCodePanel> {
  const state = await getAdminRegistrationCodeRotationState();

  return buildAdminRegistrationCodePanel({
    state,
    secret: getAdminRegistrationCodeSecret(),
    date,
  });
}

export async function verifyActiveAdminRegistrationCode(input: {
  role: AdminRole;
  code: string;
  date?: Date;
}): Promise<boolean> {
  const state = await getAdminRegistrationCodeRotationState();

  return verifyAdminRegistrationCode({
    role: input.role,
    code: input.code,
    secret: getAdminRegistrationCodeSecret(),
    rotationNonce: state.nonce,
    date: input.date,
  });
}

export async function rotateAdminRegistrationCodes(
  actor: AuthenticatedUser,
  date = new Date(),
): Promise<AdminRegistrationCodePanel> {
  const secret = getAdminRegistrationCodeSecret();

  return prisma.$transaction(async (transaction) => {
    const beforeSetting = await transaction.siteSetting.findUnique({
      where: { key: SETTING_KEY },
      select: { value: true },
    });
    const beforeState = beforeSetting
      ? parseRotationState(beforeSetting.value)
      : defaultRotationState();
    const nextState: AdminRegistrationCodeRotationState = {
      version: beforeState.version + 1,
      nonce: createRotationNonce(),
      rotatedAt: date.toISOString(),
      rotatedByUserId: actor.id,
    };
    const setting = await transaction.siteSetting.upsert({
      where: { key: SETTING_KEY },
      create: {
        key: SETTING_KEY,
        value: nextState,
      },
      update: {
        value: nextState,
      },
      select: { value: true },
    });
    const state = parseRotationState(setting.value);

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "ADMIN_REGISTRATION_CODES_ROTATED",
        targetType: "site_setting",
        targetId: SETTING_KEY,
        metadata: {
          beforeVersion: beforeState.version,
          afterVersion: state.version,
          expiresAt: getAdminRegistrationCodeExpiresAt(date).toISOString(),
          roleCount: adminRegistrationCodeRoles.length,
        },
      },
      transaction,
    );

    return buildAdminRegistrationCodePanel({
      state,
      secret,
      date,
    });
  });
}

import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit";
import {
  businessSettingsValueSchema,
  type BusinessSettingsUpdateInput,
  type BusinessSettingsValue,
} from "./settings-schemas";

export const BUSINESS_SETTINGS_KEY = "business_profile";

function defaultBusinessSettings(): BusinessSettingsValue {
  return {
    businessName: "Sunflour Bakery",
    shortDescription: null,
    supportHours: null,
    phoneNumber: null,
    whatsappNumber: null,
    emailAddress: null,
    address: null,
    instagram: null,
    tiktok: null,
    facebook: null,
  };
}

function invalidBusinessSettingsError(cause: unknown): AppError {
  return new AppError({
    code: ERROR_CODES.INTERNAL_ERROR,
    publicMessage: "Business settings are unavailable.",
    status: 500,
    cause,
  });
}

function parseBusinessSettings(
  value: Prisma.JsonValue,
  options?: { fallbackOnInvalid?: boolean },
): BusinessSettingsValue | null {
  const result = businessSettingsValueSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  if (options?.fallbackOnInvalid) {
    return null;
  }

  throw invalidBusinessSettingsError(result.error);
}

function mapBusinessSettingsRecord(record: {
  value: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...parseBusinessSettings(record.value),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getBusinessSettingsForAdmin() {
  const setting = await prisma.siteSetting.upsert({
    where: { key: BUSINESS_SETTINGS_KEY },
    create: {
      key: BUSINESS_SETTINGS_KEY,
      value: defaultBusinessSettings(),
    },
    update: {},
    select: {
      value: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return mapBusinessSettingsRecord(setting);
}

export async function getBusinessSettingsForPublic(): Promise<
  BusinessSettingsValue | null
> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: BUSINESS_SETTINGS_KEY },
    select: {
      value: true,
    },
  });

  if (!setting) {
    return null;
  }

  return parseBusinessSettings(setting.value, {
    fallbackOnInvalid: true,
  });
}

export async function updateBusinessSettings(
  input: BusinessSettingsUpdateInput,
  actor: AuthenticatedUser,
) {
  return prisma.$transaction(async (transaction) => {
    const beforeSetting = await transaction.siteSetting.findUnique({
      where: { key: BUSINESS_SETTINGS_KEY },
      select: {
        value: true,
      },
    });
    const beforeValue = beforeSetting
      ? parseBusinessSettings(beforeSetting.value, {
          fallbackOnInvalid: true,
        })
      : null;
    const setting = await transaction.siteSetting.upsert({
      where: { key: BUSINESS_SETTINGS_KEY },
      create: {
        key: BUSINESS_SETTINGS_KEY,
        value: input,
      },
      update: {
        value: input,
      },
      select: {
        value: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "BUSINESS_SETTINGS_UPDATE",
        targetType: "site_setting",
        targetId: BUSINESS_SETTINGS_KEY,
        metadata: {
          before: beforeValue,
          after: input,
        },
      },
      transaction,
    );

    return mapBusinessSettingsRecord(setting);
  });
}

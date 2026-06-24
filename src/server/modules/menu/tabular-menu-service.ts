import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit";
import { defaultTabularMenuContent } from "./tabular-menu-defaults";
import {
  tabularMenuContentValueSchema,
  type TabularMenuContentUpdateInput,
  type TabularMenuContentValue,
} from "./tabular-menu-schemas";

export const TABULAR_MENU_CONTENT_KEY = "tabular_menu_content";

function invalidTabularMenuError(cause: unknown): AppError {
  return new AppError({
    code: ERROR_CODES.INTERNAL_ERROR,
    publicMessage: "Tabular menu content is unavailable.",
    status: 500,
    cause,
  });
}

function sortTabularMenuContent(
  content: TabularMenuContentValue,
): TabularMenuContentValue {
  return {
    categories: [...content.categories].sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
    ),
    items: [...content.items]
      .map((item) => ({
        ...item,
        prices: [...item.prices].sort(
          (left, right) =>
            left.sortOrder - right.sortOrder ||
            (left.label ?? "").localeCompare(right.label ?? ""),
        ),
      }))
      .sort(
        (left, right) =>
          left.sortOrder - right.sortOrder || left.name.localeCompare(right.name),
      ),
  };
}

function parseTabularMenuContent(
  value: Prisma.JsonValue,
  options?: { fallbackOnInvalid?: boolean },
): TabularMenuContentValue | null {
  const result = tabularMenuContentValueSchema.safeParse(value);

  if (result.success) {
    return sortTabularMenuContent(result.data);
  }

  if (options?.fallbackOnInvalid) {
    return null;
  }

  throw invalidTabularMenuError(result.error);
}

function mapTabularMenuRecord(record: {
  value: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}) {
  const content = parseTabularMenuContent(record.value);

  if (!content) {
    throw invalidTabularMenuError("Missing tabular menu content.");
  }

  return {
    categories: content.categories,
    items: content.items,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getTabularMenuContentForAdmin() {
  const setting = await prisma.siteSetting.upsert({
    where: { key: TABULAR_MENU_CONTENT_KEY },
    create: {
      key: TABULAR_MENU_CONTENT_KEY,
      value: defaultTabularMenuContent,
    },
    update: {},
    select: {
      value: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return mapTabularMenuRecord(setting);
}

export async function getTabularMenuContentForPublic(): Promise<TabularMenuContentValue> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: TABULAR_MENU_CONTENT_KEY },
    select: {
      value: true,
    },
  });

  if (!setting) {
    return defaultTabularMenuContent;
  }

  return (
    parseTabularMenuContent(setting.value, {
      fallbackOnInvalid: true,
    }) ?? defaultTabularMenuContent
  );
}

export async function getTabularMenuContentSafeForPublic(): Promise<
  TabularMenuContentValue
> {
  try {
    return await getTabularMenuContentForPublic();
  } catch {
    return defaultTabularMenuContent;
  }
}

export async function updateTabularMenuContent(
  input: TabularMenuContentUpdateInput,
  actor: AuthenticatedUser,
) {
  const normalizedInput = sortTabularMenuContent(input);

  return prisma.$transaction(async (transaction) => {
    const beforeSetting = await transaction.siteSetting.findUnique({
      where: { key: TABULAR_MENU_CONTENT_KEY },
      select: {
        value: true,
      },
    });

    const beforeValue = beforeSetting
      ? parseTabularMenuContent(beforeSetting.value, {
          fallbackOnInvalid: true,
        })
      : defaultTabularMenuContent;

    const setting = await transaction.siteSetting.upsert({
      where: { key: TABULAR_MENU_CONTENT_KEY },
      create: {
        key: TABULAR_MENU_CONTENT_KEY,
        value: normalizedInput,
      },
      update: {
        value: normalizedInput,
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
        action: "TABULAR_MENU_UPDATE",
        targetType: "site_setting",
        targetId: TABULAR_MENU_CONTENT_KEY,
        metadata: {
          before: beforeValue,
          after: normalizedInput,
        },
      },
      transaction,
    );

    return mapTabularMenuRecord(setting);
  });
}

import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit";
import { defaultMenuBoards } from "./menu-boards-defaults";
import {
  menuBoardsValueSchema,
  type MenuBoardsUpdateInput,
  type MenuBoardsValue,
} from "./menu-boards-schemas";

export const MENU_BOARDS_KEY = "menu_boards";

function parseMenuBoards(value: Prisma.JsonValue): MenuBoardsValue | null {
  const result = menuBoardsValueSchema.safeParse(value);

  return result.success ? result.data : null;
}

export async function getMenuBoardsForAdmin() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: MENU_BOARDS_KEY },
    select: { value: true, updatedAt: true },
  });
  const stored = setting ? parseMenuBoards(setting.value) : null;

  return {
    boards: (stored ?? defaultMenuBoards).boards,
    updatedAt: setting?.updatedAt.toISOString() ?? null,
  };
}

export async function getVisibleMenuBoardsForPublic(): Promise<
  MenuBoardsValue["boards"]
> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: MENU_BOARDS_KEY },
    select: { value: true },
  });
  const stored = setting ? parseMenuBoards(setting.value) : null;

  return (stored ?? defaultMenuBoards).boards.filter((board) => board.visible);
}

export async function getVisibleMenuBoardsSafeForPublic(): Promise<
  MenuBoardsValue["boards"]
> {
  try {
    return await getVisibleMenuBoardsForPublic();
  } catch {
    return defaultMenuBoards.boards;
  }
}

export async function updateMenuBoards(
  input: MenuBoardsUpdateInput,
  actor: AuthenticatedUser,
) {
  if (input.boards.length > 0 && !input.boards.some((board) => board.visible)) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      publicMessage: "Keep at least one menu board visible.",
      status: 400,
    });
  }

  return prisma.$transaction(async (transaction) => {
    const before = await transaction.siteSetting.findUnique({
      where: { key: MENU_BOARDS_KEY },
      select: { value: true },
    });
    const setting = await transaction.siteSetting.upsert({
      where: { key: MENU_BOARDS_KEY },
      create: { key: MENU_BOARDS_KEY, value: input },
      update: { value: input },
      select: { updatedAt: true },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "MENU_BOARDS_UPDATE",
        targetType: "site_setting",
        targetId: MENU_BOARDS_KEY,
        metadata: {
          before: before ? parseMenuBoards(before.value) : null,
          after: input,
        },
      },
      transaction,
    );

    return {
      boards: input.boards,
      updatedAt: setting.updatedAt.toISOString(),
    };
  });
}

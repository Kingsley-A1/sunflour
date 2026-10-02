import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "@/app/api/v1/admin/menu-boards/route";
import { requireRole } from "@/server/auth/rbac";
import { UserRole } from "@/server/auth/roles";
import { getMenuBoardsForAdmin, updateMenuBoards } from "@/server/modules/menu";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/rbac", () => ({ requireRole: vi.fn() }));
vi.mock("@/server/modules/menu", async () => {
  const schemas = await vi.importActual<
    typeof import("@/server/modules/menu/menu-boards-schemas")
  >("@/server/modules/menu/menu-boards-schemas");

  return {
    menuBoardsUpdateSchema: schemas.menuBoardsUpdateSchema,
    getMenuBoardsForAdmin: vi.fn(),
    updateMenuBoards: vi.fn(),
  };
});

const actor = {
  id: "media_1",
  email: "media@example.com",
  name: null,
  image: null,
  role: UserRole.MEDIA_MANAGER,
};
const board = {
  id: "main-menu",
  title: "Main menu",
  imageUrl: "/menu-boards/main-menu.jpg",
  altText: "Main menu",
  width: 1024,
  height: 1280,
  visible: true,
};

describe("menu boards API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requires product content access", async () => {
    vi.mocked(requireRole).mockRejectedValueOnce(
      new AppError({
        code: ERROR_CODES.FORBIDDEN,
        publicMessage: "You do not have permission to perform this action.",
        status: 403,
      }),
    );

    const response = await GET();
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(403);
    expect(vi.mocked(getMenuBoardsForAdmin)).not.toHaveBeenCalled();
    expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("saves valid boards and rejects invalid ones", async () => {
    vi.mocked(requireRole).mockResolvedValue(actor);
    vi.mocked(updateMenuBoards).mockResolvedValueOnce({
      boards: [board],
      updatedAt: "2026-10-02T10:00:00.000Z",
    });

    const ok = await PATCH(
      new Request("https://sunflour.test/api/v1/admin/menu-boards", {
        method: "PATCH",
        body: JSON.stringify({ boards: [board] }),
      }),
    );
    const okBody = (await ok.json()) as ApiSuccess<{ menuBoards: { boards: unknown[] } }>;

    expect(ok.status).toBe(200);
    expect(okBody.data.menuBoards.boards).toHaveLength(1);

    const bad = await PATCH(
      new Request("https://sunflour.test/api/v1/admin/menu-boards", {
        method: "PATCH",
        body: JSON.stringify({ boards: [{ ...board, imageUrl: "javascript:x" }] }),
      }),
    );

    expect(bad.status).toBe(400);
    expect(vi.mocked(updateMenuBoards)).toHaveBeenCalledTimes(1);
  });
});

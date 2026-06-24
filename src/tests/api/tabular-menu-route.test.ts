import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "@/app/api/v1/admin/tabular-menu/route";
import { requireRole } from "@/server/auth/rbac";
import { UserRole } from "@/server/auth/roles";
import {
  getTabularMenuContentForAdmin,
  updateTabularMenuContent,
} from "@/server/modules/menu";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/auth/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/server/modules/menu", () => ({
  getTabularMenuContentForAdmin: vi.fn(),
  updateTabularMenuContent: vi.fn(),
  tabularMenuContentUpdateSchema: {
    safeParse: (input: unknown) => ({
      success: true,
      data: input,
    }),
  },
}));

const mockedRequireRole = vi.mocked(requireRole);
const mockedGetTabularMenuContentForAdmin = vi.mocked(getTabularMenuContentForAdmin);
const mockedUpdateTabularMenuContent = vi.mocked(updateTabularMenuContent);

function forbidden(): AppError {
  return new AppError({
    code: ERROR_CODES.FORBIDDEN,
    publicMessage: "You do not have permission to perform this action.",
    status: 403,
  });
}

describe("tabular menu API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requires product content access for reads", async () => {
    mockedRequireRole.mockRejectedValueOnce(forbidden());

    const response = await GET();
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(403);
    expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(mockedGetTabularMenuContentForAdmin).not.toHaveBeenCalled();
  });

  it("returns admin tabular menu content", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      id: "media_1",
      email: "media@example.com",
      name: null,
      image: null,
      role: UserRole.MEDIA_MANAGER,
    });
    mockedGetTabularMenuContentForAdmin.mockResolvedValueOnce({
      categories: [],
      items: [],
      createdAt: "2026-06-24T10:00:00.000Z",
      updatedAt: "2026-06-24T10:00:00.000Z",
    });

    const response = await GET();
    const body = (await response.json()) as ApiSuccess<{
      tabularMenu: { categories: unknown[]; items: unknown[] };
    }>;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.tabularMenu.categories).toEqual([]);
  });

  it("updates tabular menu content for allowed admins", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      id: "media_1",
      email: "media@example.com",
      name: null,
      image: null,
      role: UserRole.MEDIA_MANAGER,
    });
    mockedUpdateTabularMenuContent.mockResolvedValueOnce({
      categories: [],
      items: [],
      createdAt: "2026-06-24T10:00:00.000Z",
      updatedAt: "2026-06-24T10:00:00.000Z",
    });

    const response = await PATCH(
      new Request("https://sunflour.test/api/v1/admin/tabular-menu", {
        method: "PATCH",
        body: JSON.stringify({
          categories: [],
          items: [],
        }),
      }),
    );
    const body = (await response.json()) as ApiSuccess<{
      tabularMenu: { categories: unknown[]; items: unknown[] };
    }>;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockedUpdateTabularMenuContent).toHaveBeenCalledWith(
      {
        categories: [],
        items: [],
      },
      expect.objectContaining({
        role: UserRole.MEDIA_MANAGER,
      }),
    );
  });
});

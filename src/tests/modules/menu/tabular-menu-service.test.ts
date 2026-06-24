import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma/enums";
import { writeAuditLog } from "@/server/modules/audit";
import {
  getTabularMenuContentForAdmin,
  getTabularMenuContentForPublic,
  TABULAR_MENU_CONTENT_KEY,
  updateTabularMenuContent,
} from "@/server/modules/menu";

const mocks = vi.hoisted(() => ({
  siteSettingFindUnique: vi.fn(),
  siteSettingUpsert: vi.fn(),
  transaction: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    siteSetting: {
      findUnique: mocks.siteSettingFindUnique,
      upsert: mocks.siteSettingUpsert,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/server/modules/audit", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

const actor = {
  id: "media_1",
  email: "media@example.com",
  name: null,
  image: null,
  role: UserRole.MEDIA_MANAGER,
};

const now = new Date("2026-06-24T10:00:00.000Z");

const storedMenu = {
  categories: [
    {
      id: "cakes",
      label: "Cakes",
      summary: "Celebration cakes and slices.",
      sortOrder: 0,
    },
  ],
  items: [
    {
      id: "red-velvet",
      categoryId: "cakes",
      name: "Red Velvet",
      description: "Moist red velvet cake.",
      details: "Classic cream cheese finish.",
      imageUrl: "https://example.com/red-velvet.jpg",
      imageAlt: "Red velvet cake from Sunflour Bakery",
      prices: [
        {
          id: "red-velvet-price-1",
          label: null,
          amount: 125000,
          sortOrder: 0,
        },
      ],
      tags: ["popular"],
      ingredients: ["flour", "cocoa"],
      sortOrder: 0,
    },
  ],
};

describe("tabular menu service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        siteSetting: {
          findUnique: mocks.siteSettingFindUnique,
          upsert: mocks.siteSettingUpsert,
        },
        auditLog: {
          create: vi.fn(),
        },
      }),
    );
    vi.mocked(writeAuditLog).mockResolvedValue({ id: "audit_1" });
  });

  it("returns default-backed admin content when no record exists yet", async () => {
    mocks.siteSettingUpsert.mockResolvedValueOnce({
      value: storedMenu,
      createdAt: now,
      updatedAt: now,
    });

    const menu = await getTabularMenuContentForAdmin();

    expect(menu.categories[0]?.id).toBe("cakes");
    expect(menu.createdAt).toBe(now.toISOString());
    expect(mocks.siteSettingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: TABULAR_MENU_CONTENT_KEY },
      }),
    );
  });

  it("falls back to defaults safely for public reads when stored JSON is invalid", async () => {
    mocks.siteSettingFindUnique.mockResolvedValueOnce({
      value: {
        categories: [{ id: "bad", label: 1 }],
      },
    });

    const menu = await getTabularMenuContentForPublic();

    expect(menu.categories.length).toBeGreaterThan(0);
    expect(menu.items.length).toBeGreaterThan(0);
  });

  it("updates content and writes an audit log", async () => {
    mocks.siteSettingFindUnique.mockResolvedValueOnce({
      value: storedMenu,
    });
    mocks.siteSettingUpsert.mockResolvedValueOnce({
      value: storedMenu,
      createdAt: now,
      updatedAt: now,
    });

    const menu = await updateTabularMenuContent(storedMenu, actor);

    expect(menu.updatedAt).toBe(now.toISOString());
    expect(vi.mocked(writeAuditLog)).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: actor.id,
        action: "TABULAR_MENU_UPDATE",
        targetType: "site_setting",
        targetId: TABULAR_MENU_CONTENT_KEY,
      }),
      expect.anything(),
    );
  });
});

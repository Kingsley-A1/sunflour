import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma/enums";
import { writeAuditLog } from "@/server/modules/audit";
import {
  getBusinessSettingsForAdmin,
  getBusinessSettingsForPublic,
  updateBusinessSettings,
} from "@/server/modules/settings";

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
  id: "super_1",
  email: "owner@example.com",
  name: null,
  image: null,
  role: UserRole.SUPER_ADMIN,
};

const now = new Date("2026-06-23T10:00:00.000Z");

describe("settings service", () => {
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

  it("returns default business settings when no admin-managed record exists", async () => {
    mocks.siteSettingUpsert.mockResolvedValueOnce({
      value: {
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
      },
      createdAt: now,
      updatedAt: now,
    });

    const settings = await getBusinessSettingsForAdmin();

    expect(settings.businessName).toBe("Sunflour Bakery");
    expect(settings.createdAt).toBe(now.toISOString());
    expect(mocks.siteSettingUpsert).toHaveBeenCalled();
  });

  it("falls back safely for public reads when the stored JSON is invalid", async () => {
    mocks.siteSettingFindUnique.mockResolvedValueOnce({
      value: {
        businessName: 123,
      },
    });

    await expect(getBusinessSettingsForPublic()).resolves.toBeNull();
  });

  it("updates business settings and writes an audit log", async () => {
    const input = {
      businessName: "Sunflour Bakery",
      shortDescription: "Fresh bakes in Calabar.",
      supportHours: "Mon-Sat, 8am-7pm",
      phoneNumber: "+2348012345678",
      whatsappNumber: "+2348012345678",
      emailAddress: "hello@sunflourbakery.com",
      address: "12 Bakery Street, Calabar",
      instagram: "@sunflourbakery",
      tiktok: "@sunflourbakery",
      facebook: "@SunflourBakery",
    };

    mocks.siteSettingFindUnique.mockResolvedValueOnce({
      value: {
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
      },
    });
    mocks.siteSettingUpsert.mockResolvedValueOnce({
      value: input,
      createdAt: now,
      updatedAt: now,
    });

    const settings = await updateBusinessSettings(input, actor);

    expect(settings.emailAddress).toBe("hello@sunflourbakery.com");
    expect(vi.mocked(writeAuditLog)).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: actor.id,
        action: "BUSINESS_SETTINGS_UPDATE",
        targetType: "site_setting",
      }),
      expect.anything(),
    );
  });
});

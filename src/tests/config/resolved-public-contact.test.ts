import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBusinessSettingsForPublic: vi.fn(),
}));

vi.mock("@/server/modules/settings", () => ({
  getBusinessSettingsForPublic: mocks.getBusinessSettingsForPublic,
}));

const originalEnv = { ...process.env };

describe("resolved public contact config", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("falls back to environment contact config when admin settings cannot be loaded", async () => {
    process.env.NEXT_PUBLIC_SUNFLOUR_EMAIL_ADDRESS =
      "support@sunflourbakery.com";
    process.env.NEXT_PUBLIC_SUNFLOUR_WHATSAPP_NUMBER = "+2348012345678";
    mocks.getBusinessSettingsForPublic.mockRejectedValueOnce(
      new Error("database unavailable"),
    );

    const { getResolvedPublicContactConfig } = await import(
      "@/server/config/public-contact"
    );
    const config = await getResolvedPublicContactConfig();

    expect(config.emailAddress).toBe("support@sunflourbakery.com");
    expect(config.emailHref).toBe("mailto:support@sunflourbakery.com");
    expect(config.whatsappNumber).toBe("+2348012345678");
    expect(config.whatsappHref).toBe("https://wa.me/2348012345678");
  });
});

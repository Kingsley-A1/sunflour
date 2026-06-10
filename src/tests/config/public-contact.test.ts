import { afterEach, describe, expect, it } from "vitest";
import { getPublicContactConfig } from "@/server/config/public-contact";

const originalEnv = { ...process.env };

describe("public contact config", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("strips accidental surrounding quotes from public contact values", () => {
    process.env.EMAIL_ADDRESS = '"sunflourbakery7@gmail.com"';
    process.env.FACEBOOK = '"Sunflourbakery_calabar"';

    const config = getPublicContactConfig();

    expect(config.emailAddress).toBe("sunflourbakery7@gmail.com");
    expect(config.emailHref).toBe("mailto:sunflourbakery7@gmail.com");
    expect(config.facebook).toBe("@Sunflourbakery_calabar");
    expect(config.facebookHref).toBe(
      "https://www.facebook.com/Sunflourbakery_calabar",
    );
  });

  it("does not emit malformed mailto links for invalid email values", () => {
    process.env.EMAIL_ADDRESS = '"not an email"';

    const config = getPublicContactConfig();

    expect(config.emailAddress).toBe("not an email");
    expect(config.emailHref).toBeNull();
  });
});

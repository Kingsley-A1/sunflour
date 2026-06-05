import { describe, expect, it } from "vitest";
import {
  EnvValidationError,
  getServerEnv,
  requireDatabaseUrl,
} from "@/server/config/env";

describe("environment validation", () => {
  it("applies safe defaults for local development", () => {
    const env = getServerEnv({});

    expect(env.NODE_ENV).toBe("development");
    expect(env.APP_TIME_ZONE).toBe("Africa/Lagos");
  });

  it("rejects malformed URLs", () => {
    expect(() =>
      getServerEnv({ NEXT_PUBLIC_APP_URL: "not-a-url" }),
    ).toThrow(EnvValidationError);
  });

  it("treats blank optional values as unset", () => {
    const env = getServerEnv({
      TEST_DATABASE_URL: "",
      SHADOW_DATABASE_URL: "",
      NEXTAUTH_URL: "",
      EMAIL_SENDING_ENABLED: "",
      EMAIL_OUTBOX_BATCH_SIZE: "",
    });

    expect(env.TEST_DATABASE_URL).toBeUndefined();
    expect(env.SHADOW_DATABASE_URL).toBeUndefined();
    expect(env.NEXTAUTH_URL).toBeUndefined();
    expect(env.EMAIL_SENDING_ENABLED).toBe(false);
    expect(env.EMAIL_OUTBOX_BATCH_SIZE).toBe(10);
  });

  it("requires DATABASE_URL in production", () => {
    expect(() => getServerEnv({ NODE_ENV: "production" })).toThrow(
      EnvValidationError,
    );
  });

  it("requires production auth values", () => {
    expect(() =>
      getServerEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://user:pass@example.com:26257/sunflour",
      }),
    ).toThrow(EnvValidationError);
  });

  it("requires the admin registration code secret in production", () => {
    expect(() =>
      getServerEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://user:pass@example.com:26257/sunflour",
        AUTH_SECRET: "12345678901234567890123456789012",
      }),
    ).toThrow(EnvValidationError);
  });

  it("allows Google OAuth to be intentionally disabled", () => {
    const env = getServerEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:pass@example.com:26257/sunflour",
      AUTH_SECRET: "12345678901234567890123456789012",
      ADMIN_REGISTRATION_CODE_SECRET: "12345678901234567890123456789012",
    });

    expect(env.AUTH_GOOGLE_ID).toBeUndefined();
    expect(env.AUTH_GOOGLE_SECRET).toBeUndefined();
  });

  it("requires paired Google OAuth credentials when enabled", () => {
    expect(() =>
      getServerEnv({
        AUTH_GOOGLE_ID: "google-client-id",
      }),
    ).toThrow(EnvValidationError);
  });

  it("rejects placeholder production auth values", () => {
    expect(() =>
      getServerEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://user:pass@example.com:26257/sunflour",
        AUTH_SECRET: "<generate-with-openssl-rand-base64-32>",
        ADMIN_REGISTRATION_CODE_SECRET:
          "<generate-with-openssl-rand-base64-32>",
      }),
    ).toThrow(EnvValidationError);
  });

  it("accepts required production auth and database configuration", () => {
    const env = getServerEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:pass@example.com:26257/sunflour",
      AUTH_SECRET: "12345678901234567890123456789012",
      ADMIN_REGISTRATION_CODE_SECRET: "12345678901234567890123456789012",
      AUTH_GOOGLE_ID: "google-client-id",
      AUTH_GOOGLE_SECRET: "google-client-secret",
    });

    expect(env.NODE_ENV).toBe("production");
    expect(env.AUTH_GOOGLE_ID).toBe("google-client-id");
  });

  it("requires DATABASE_URL for database commands", () => {
    expect(() => requireDatabaseUrl({ NODE_ENV: "development" })).toThrow(
      EnvValidationError,
    );
  });
});

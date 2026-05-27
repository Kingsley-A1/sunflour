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

  it("requires DATABASE_URL in production", () => {
    expect(() => getServerEnv({ NODE_ENV: "production" })).toThrow(
      EnvValidationError,
    );
  });

  it("accepts required production auth and database configuration", () => {
    const env = getServerEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:pass@example.com:26257/sunflour",
      AUTH_SECRET: "12345678901234567890123456789012",
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

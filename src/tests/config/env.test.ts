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

  it("requires DATABASE_URL for database commands", () => {
    expect(() => requireDatabaseUrl({ NODE_ENV: "development" })).toThrow(
      EnvValidationError,
    );
  });
});

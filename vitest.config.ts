import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  test: {
    environment: "node",
    env: {
      AUTH_GOOGLE_ID: "test-google-client-id",
      AUTH_GOOGLE_SECRET: "test-google-client-secret",
      AUTH_SECRET: "12345678901234567890123456789012",
      DATABASE_URL:
        "postgresql://test:test@localhost:26257/sunflour_test?sslmode=disable",
      EMAIL_SENDING_ENABLED: "false",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      RUN_DB_TESTS: "false",
    },
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["src/generated/**", "src/**/*.test.ts", "src/**/*.test.tsx"],
    },
  },
});

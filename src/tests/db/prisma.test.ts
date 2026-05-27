import { describe, expect, it } from "vitest";
import { checkDatabaseConnection, prisma } from "@/server/db/prisma";

describe.skipIf(
  process.env.RUN_DB_TESTS !== "true" || !process.env.DATABASE_URL,
)("database connection", () => {
  it("connects to CockroachDB through Prisma", async () => {
    await expect(checkDatabaseConnection()).resolves.toBe(true);
    await prisma.$disconnect();
  });
});

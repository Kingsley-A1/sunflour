import "dotenv/config";
import { defineConfig } from "prisma/config";

const optionalEnv = (value: string | undefined) => {
  if (!value || value.trim() === "") {
    return undefined;
  }

  return value;
};

function requirePrismaDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Prisma commands.");
  }

  return process.env.DATABASE_URL;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: requirePrismaDatabaseUrl(),
    shadowDatabaseUrl: optionalEnv(process.env.SHADOW_DATABASE_URL),
  },
});

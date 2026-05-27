import "dotenv/config";
import { defineConfig } from "prisma/config";

const fallbackDatabaseUrl =
  "postgresql://root@localhost:26257/sunflour?sslmode=disable";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});

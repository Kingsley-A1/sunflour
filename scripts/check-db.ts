import "dotenv/config";

import { prisma } from "@/server/db/prisma";

async function main(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connection ok");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

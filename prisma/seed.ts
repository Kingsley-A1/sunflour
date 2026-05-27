import "dotenv/config";
import { seedAdminAllowlist } from "../src/server/auth/seed-admins";

const result = await seedAdminAllowlist();

console.log(
  `Seeded ${result.count} admin allowlist entr${
    result.count === 1 ? "y" : "ies"
  }.`,
);

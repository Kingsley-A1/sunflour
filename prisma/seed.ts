import "dotenv/config";
import { seedAdminAllowlist } from "../src/server/auth/seed-admins";
import { seedInitialMenuFromFile } from "../src/server/modules/menu/seed-menu";

const adminResult = await seedAdminAllowlist();

console.log(
  `Seeded ${adminResult.count} admin allowlist entr${
    adminResult.count === 1 ? "y" : "ies"
  }.`,
);

if (process.env.SUNFLOUR_MENU_SEED_PATH) {
  const menuResult = await seedInitialMenuFromFile(
    process.env.SUNFLOUR_MENU_SEED_PATH,
  );

  console.log(
    `Seeded ${menuResult.categories} categories, ${menuResult.products} products, and ${menuResult.variants} variants.`,
  );
} else {
  console.log("Skipped menu seed because SUNFLOUR_MENU_SEED_PATH is not set.");
}

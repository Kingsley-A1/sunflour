import "dotenv/config";

import { getAdminRegistrationCodePanel } from "@/server/auth/admin-registration-code-service";

const panel = await getAdminRegistrationCodePanel();
console.log("Sunflour admin registration codes");
console.log(`Version: ${panel.version}`);
console.log(`Window: ${panel.window}`);
console.log(`Expires: ${panel.expiresAt}`);

for (const item of panel.codes) {
  console.log(`${item.label}: ${item.code}`);
}

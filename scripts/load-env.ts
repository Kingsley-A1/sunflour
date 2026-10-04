import { config } from "dotenv";

// Match Next.js precedence: .env.local overrides .env. dotenv never overwrites
// variables that are already set, so load the higher-priority file first.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function collectTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectTypeScriptFiles(fullPath);
      }

      if (
        entry.isFile() &&
        (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))
      ) {
        return [fullPath];
      }

      return [];
    }),
  );

  return nested.flat();
}

describe("email infrastructure boundary", () => {
  it("keeps Resend API access inside the email module", async () => {
    const files = [
      ...(await collectTypeScriptFiles(path.join(process.cwd(), "src", "app"))),
      ...(await collectTypeScriptFiles(
        path.join(process.cwd(), "src", "server"),
      )),
    ];
    const matches: string[] = [];

    for (const file of files) {
      const contents = await readFile(file, "utf8");

      if (contents.includes("api.resend.com")) {
        matches.push(path.relative(process.cwd(), file).replaceAll("\\", "/"));
      }
    }

    expect(matches).toEqual(["src/server/modules/email/resend-client.ts"]);
  }, 20_000);
});

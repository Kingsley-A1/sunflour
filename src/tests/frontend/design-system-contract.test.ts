import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.(tsx?|css)$/.test(name)
        ? [path]
        : [];
  });
}

describe("design-system package contract", () => {
  it("keeps the application entrypoint intentionally small and ordered", () => {
    expect(read("src/app/globals.css").replaceAll("\r\n", "\n")).toBe(
      '@import "tailwindcss";\n' +
        '@import "@sunflour/design-tokens/tokens.css";\n' +
        '@import "@sunflour/design-tokens/themes.css";\n' +
        '@import "@sunflour/design-tokens/motion.css";\n' +
        '@import "../styles/component-contracts.css";\n',
    );
  });

  it("publishes versioned framework-neutral token, theme, and motion files", () => {
    const manifest = JSON.parse(read("packages/design-tokens/package.json")) as {
      name: string;
      version: string;
      exports: Record<string, string>;
    };

    expect(manifest.name).toBe("@sunflour/design-tokens");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(Object.keys(manifest.exports)).toEqual([
      "./tokens.css",
      "./themes.css",
      "./motion.css",
    ]);
  });

  it("preserves primitive, semantic, compatibility, layout, type, and motion layers", () => {
    const tokens = read("packages/design-tokens/tokens.css");
    const themes = read("packages/design-tokens/themes.css");
    const motion = read("packages/design-tokens/motion.css");
    const components = read("src/styles/component-contracts.css");

    expect(tokens).toContain("--primitive-brand-red: #b22416;");
    expect(tokens).toContain("--layout-container-public:");
    expect(tokens).toContain("--type-page-title-size:");
    expect(themes).toContain("--color-canvas:");
    expect(themes).toContain("--color-surface-raised:");
    expect(themes).toContain("--color-bg: var(--color-canvas);");
    expect(themes).toContain("@media (prefers-color-scheme: dark)");
    expect(motion).toContain("@media (prefers-reduced-motion: reduce)");
    expect(components).toContain(".sf-container-public");
    expect(components).toContain(".sf-page-title");
  });

  it("prevents component and route code from consuming primitives or deprecated aliases", () => {
    const files = sourceFiles(join(root, "src"))
      .filter((path) => !path.includes(join("src", "tests")))
      .filter((path) => !path.endsWith(join("src", "app", "globals.css")))
      .filter((path) => !path.endsWith(join("src", "styles", "component-contracts.css")));
    const forbidden =
      /--primitive-|--color-(?:bg|bg-subtle|surface-soft|surface-elevated|brand-red|brand-yellow|cream)\b|--motion-(?:fast|normal|slow)\b|--ease-standard\b|--shadow-(?:soft|card)\b/;
    const violations = files
      .filter((path) => forbidden.test(readFileSync(path, "utf8")))
      .map((path) => relative(root, path));

    expect(violations).toEqual([]);
  });
});

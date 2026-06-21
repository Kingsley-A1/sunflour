import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "../../../next.config";

describe("content security policy", () => {
  it("allows unsafe-eval only in development", () => {
    expect(buildContentSecurityPolicy("development")).toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy("production")).not.toContain("'unsafe-eval'");
  });
});

import { describe, expect, it } from "vitest";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { readJsonBody } from "@/server/lib/api/request";

describe("API request helpers", () => {
  it("returns a typed validation error for malformed JSON", async () => {
    const request = new Request("https://sunflour.test/api", {
      method: "POST",
      body: "{invalid",
    });

    await expect(readJsonBody(request)).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      fieldErrors: {
        body: ["Request body must be valid JSON."],
      },
    });
  });
});

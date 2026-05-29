import { describe, expect, it } from "vitest";
import { errorFromUnknown } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";

describe("app error mapping", () => {
  it("maps Prisma not-found errors to NOT_FOUND", () => {
    const error = errorFromUnknown({
      code: "P2025",
      message: "Record not found",
    });

    expect(error).toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});

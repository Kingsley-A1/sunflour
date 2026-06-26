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

  it("maps Prisma unique constraint errors to CONFLICT with field errors", () => {
    const error = errorFromUnknown({
      code: "P2002",
      message: "Unique constraint failed on the fields: (`slug`)",
      meta: {
        target: ["slug"],
      },
    });

    expect(error).toMatchObject({
      code: ERROR_CODES.CONFLICT,
      status: 409,
      publicMessage: "A record already exists with this value.",
      fieldErrors: {
        slug: ["This value is already in use."],
      },
    });
  });
});

import { z } from "zod";
import { describe, expect, it } from "vitest";
import { AppError } from "@/server/lib/errors/app-error";
import { validateInput } from "@/server/lib/validation/zod";

describe("Zod validation helper", () => {
  const schema = z.object({
    name: z.string().min(1),
    quantity: z.number().int().positive(),
  });

  it("returns typed data for valid input", () => {
    const result = validateInput(schema, { name: "Bread", quantity: 2 });

    expect(result.name).toBe("Bread");
    expect(result.quantity).toBe(2);
  });

  it("throws a structured app error for invalid input", () => {
    expect(() => validateInput(schema, { name: "", quantity: 0 })).toThrow(
      AppError,
    );
  });
});

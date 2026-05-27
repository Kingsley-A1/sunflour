import { z } from "zod";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";

export function formatZodFieldErrors(
  error: z.ZodError,
): Record<string, string[]> {
  const flattened = error.flatten();

  return Object.fromEntries(
    Object.entries(flattened.fieldErrors).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}

export function validateInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      publicMessage: "Check the highlighted fields and try again.",
      status: 400,
      fieldErrors: formatZodFieldErrors(result.error),
      cause: result.error,
    });
  }

  return result.data;
}

import { z } from "zod";
import { formatZodFieldErrors } from "@/server/lib/validation/zod";

type EnvInput = Record<string, string | undefined>;

export class EnvValidationError extends Error {
  readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>) {
    super("Invalid environment configuration");
    this.name = "EnvValidationError";
    this.fieldErrors = fieldErrors;
  }
}

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    APP_TIME_ZONE: z.string().min(1).default("Africa/Lagos"),
    DATABASE_URL: z.string().url().optional(),
    TEST_DATABASE_URL: z.string().url().optional(),
    SHADOW_DATABASE_URL: z.string().url().optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    AUTH_SECRET: z.string().min(32).optional(),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    ADMIN_ALLOWLIST_EMAILS: z.string().optional().default(""),
    RUN_DB_TESTS: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === "production" && !env.DATABASE_URL) {
      context.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required in production.",
      });
    }

    if (env.NODE_ENV === "production" && !env.AUTH_SECRET) {
      context.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message: "AUTH_SECRET is required in production.",
      });
    }

    if (env.NODE_ENV === "production" && !env.AUTH_GOOGLE_ID) {
      context.addIssue({
        code: "custom",
        path: ["AUTH_GOOGLE_ID"],
        message: "AUTH_GOOGLE_ID is required in production.",
      });
    }

    if (env.NODE_ENV === "production" && !env.AUTH_GOOGLE_SECRET) {
      context.addIssue({
        code: "custom",
        path: ["AUTH_GOOGLE_SECRET"],
        message: "AUTH_GOOGLE_SECRET is required in production.",
      });
    }
  });

export type ServerEnv = z.infer<typeof envSchema>;

export function getServerEnv(input: EnvInput = process.env): ServerEnv {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    throw new EnvValidationError(formatZodFieldErrors(result.error));
  }

  return result.data;
}

export function requireDatabaseUrl(
  input: EnvInput = process.env,
): string {
  const env = getServerEnv(input);

  if (!env.DATABASE_URL) {
    throw new EnvValidationError({
      DATABASE_URL: ["DATABASE_URL is required for database commands."],
    });
  }

  return env.DATABASE_URL;
}

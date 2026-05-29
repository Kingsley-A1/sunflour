import { z } from "zod";
import { formatZodFieldErrors } from "@/server/lib/validation/zod";

type EnvInput = Record<string, string | undefined>;

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const optionalString = (schema: z.ZodString) =>
  z.preprocess(emptyStringToUndefined, schema.optional());

const optionalUrl = optionalString(z.string().url());
const optionalSecret = optionalString(z.string().min(1));
const optionalEmail = optionalString(z.string().email());

const optionalBoolean = z
  .preprocess(emptyStringToUndefined, z.enum(["true", "false"]).optional())
  .transform((value) => value === "true");

const optionalNumberWithDefault = (
  min: number,
  max: number,
  defaultValue: number,
) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().min(min).max(max).default(defaultValue),
  );

const isPlaceholderValue = (value: string | undefined) => {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  return (
    normalized.startsWith("<") ||
    normalized.includes("placeholder") ||
    normalized.startsWith("missing-")
  );
};

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
    NEXT_PUBLIC_APP_URL: optionalUrl,
    APP_TIME_ZONE: z.string().min(1).default("Africa/Lagos"),
    DATABASE_URL: optionalUrl,
    TEST_DATABASE_URL: optionalUrl,
    SHADOW_DATABASE_URL: optionalUrl,
    NEXTAUTH_URL: optionalUrl,
    AUTH_SECRET: optionalString(z.string().min(32)),
    AUTH_GOOGLE_ID: optionalSecret,
    AUTH_GOOGLE_SECRET: optionalSecret,
    ADMIN_ALLOWLIST_EMAILS: z.string().optional().default(""),
    RESEND_API_KEY: optionalSecret,
    EMAIL_FROM_ADDRESS: optionalEmail,
    EMAIL_FROM_NAME: z.string().min(1).default("Sunflour Bakery"),
    EMAIL_SENDING_ENABLED: optionalBoolean,
    EMAIL_OUTBOX_BATCH_SIZE: optionalNumberWithDefault(1, 50, 10),
    EMAIL_CRON_SECRET: optionalString(z.string().min(16)),
    ADMIN_ORDER_ALERT_EMAILS: z.string().optional().default(""),
    R2_ACCOUNT_ID: optionalSecret,
    R2_ACCESS_KEY_ID: optionalSecret,
    R2_SECRET_ACCESS_KEY: optionalSecret,
    R2_BUCKET_NAME: optionalSecret,
    R2_PUBLIC_BASE_URL: optionalUrl,
    R2_PRESIGNED_UPLOAD_EXPIRES_SECONDS: optionalNumberWithDefault(
      60,
      3600,
      300,
    ),
    RUN_DB_TESTS: optionalBoolean,
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

    for (const key of [
      "AUTH_SECRET",
      "AUTH_GOOGLE_ID",
      "AUTH_GOOGLE_SECRET",
    ] as const) {
      if (env.NODE_ENV === "production" && isPlaceholderValue(env[key])) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key} must be a real production value, not a placeholder.`,
        });
      }
    }

    if (env.EMAIL_SENDING_ENABLED && !env.RESEND_API_KEY) {
      context.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY is required when email sending is enabled.",
      });
    }

    if (env.EMAIL_SENDING_ENABLED && !env.EMAIL_FROM_ADDRESS) {
      context.addIssue({
        code: "custom",
        path: ["EMAIL_FROM_ADDRESS"],
        message:
          "EMAIL_FROM_ADDRESS is required when email sending is enabled.",
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

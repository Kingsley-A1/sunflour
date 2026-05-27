import { z } from "zod";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";

const r2ConfigSchema = z.object({
  accountId: z.string().min(1),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  bucketName: z.string().min(1),
  publicBaseUrl: z.string().url().optional(),
  expiresInSeconds: z.coerce.number().int().min(60).max(3600).default(300),
});

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl?: string;
  expiresInSeconds: number;
}

export function getR2Config(
  input: Record<string, string | undefined> = process.env,
): R2Config {
  const result = r2ConfigSchema.safeParse({
    accountId: input.R2_ACCOUNT_ID,
    accessKeyId: input.R2_ACCESS_KEY_ID,
    secretAccessKey: input.R2_SECRET_ACCESS_KEY,
    bucketName: input.R2_BUCKET_NAME,
    publicBaseUrl: input.R2_PUBLIC_BASE_URL,
    expiresInSeconds: input.R2_PRESIGNED_UPLOAD_EXPIRES_SECONDS,
  });

  if (!result.success) {
    throw new AppError({
      code: ERROR_CODES.INTERNAL_ERROR,
      publicMessage: "Media upload is not configured.",
      status: 500,
      cause: result.error,
    });
  }

  return result.data;
}

export function getR2Endpoint(config: R2Config): string {
  return `https://${config.accountId}.r2.cloudflarestorage.com`;
}

export function getPublicMediaUrl(
  config: R2Config,
  objectKey: string,
): string | null {
  if (!config.publicBaseUrl) {
    return null;
  }

  return `${config.publicBaseUrl.replace(/\/$/, "")}/${objectKey}`;
}

import { z } from "zod";
import { MediaUploadPurpose } from "@/generated/prisma/enums";

export const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export const presignedUploadRequestSchema = z
  .object({
    fileName: z.string().trim().min(1).max(180),
    contentType: z.enum(ALLOWED_IMAGE_CONTENT_TYPES),
    byteSize: z.number().int().min(1).max(MAX_PRODUCT_IMAGE_BYTES),
    purpose: z.literal(MediaUploadPurpose.PRODUCT_IMAGE),
  })
  .strict();

export const completeMediaUploadSchema = z
  .object({
    publicUrl: z.string().url().optional(),
  })
  .strict();

export const mediaIdParamSchema = z.object({
  id: z.string().min(1),
});

export type PresignedUploadRequestInput = z.infer<
  typeof presignedUploadRequestSchema
>;
export type CompleteMediaUploadInput = z.infer<
  typeof completeMediaUploadSchema
>;

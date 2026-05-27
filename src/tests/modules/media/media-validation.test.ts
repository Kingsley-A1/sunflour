import { describe, expect, it } from "vitest";
import { MediaUploadPurpose } from "@/generated/prisma/enums";
import {
  MAX_PRODUCT_IMAGE_BYTES,
  presignedUploadRequestSchema,
} from "@/server/modules/media/media-schemas";
import {
  getPublicMediaUrl,
  getR2Config,
  getR2Endpoint,
} from "@/server/modules/media/r2-config";
import { AppError } from "@/server/lib/errors/app-error";

describe("media upload validation", () => {
  it("accepts controlled product image uploads", () => {
    const result = presignedUploadRequestSchema.safeParse({
      fileName: "cake.webp",
      contentType: "image/webp",
      byteSize: 125_000,
      purpose: MediaUploadPurpose.PRODUCT_IMAGE,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid file types before a signed URL can be created", () => {
    const result = presignedUploadRequestSchema.safeParse({
      fileName: "invoice.pdf",
      contentType: "application/pdf",
      byteSize: 125_000,
      purpose: MediaUploadPurpose.PRODUCT_IMAGE,
    });

    expect(result.success).toBe(false);
  });

  it("rejects oversized product images", () => {
    const result = presignedUploadRequestSchema.safeParse({
      fileName: "huge.png",
      contentType: "image/png",
      byteSize: MAX_PRODUCT_IMAGE_BYTES + 1,
      purpose: MediaUploadPurpose.PRODUCT_IMAGE,
    });

    expect(result.success).toBe(false);
  });
});

describe("R2 config", () => {
  it("builds the Cloudflare R2 S3 endpoint", () => {
    const config = getR2Config({
      R2_ACCOUNT_ID: "account",
      R2_ACCESS_KEY_ID: "access",
      R2_SECRET_ACCESS_KEY: "secret",
      R2_BUCKET_NAME: "bucket",
      R2_PUBLIC_BASE_URL: "https://media.example.com",
      R2_PRESIGNED_UPLOAD_EXPIRES_SECONDS: "300",
    });

    expect(getR2Endpoint(config)).toBe(
      "https://account.r2.cloudflarestorage.com",
    );
    expect(getPublicMediaUrl(config, "product-images/cake.webp")).toBe(
      "https://media.example.com/product-images/cake.webp",
    );
  });

  it("fails closed when R2 is not configured", () => {
    expect(() => getR2Config({})).toThrow(AppError);
  });
});

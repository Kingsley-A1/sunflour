import { randomUUID } from "node:crypto";
import {
  HeadObjectCommand,
  type HeadObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MediaAssetStatus, MediaUploadPurpose } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import type {
  AdminMediaUploadPurpose,
  PresignedUploadRequestInput,
} from "./media-schemas";
import { getPublicMediaUrl, getR2Config, getR2Endpoint } from "./r2-config";
import type { R2Config } from "./r2-config";
import { storageErrorFromUnknown } from "./r2-errors";

const extensionByContentType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export interface SignedUploadResult {
  mediaAsset: {
    id: string;
    objectKey: string;
    publicUrl: string | null;
    status: MediaAssetStatus;
  };
  upload: {
    method: "PUT";
    url: string;
    expiresInSeconds: number;
    headers: {
      "content-type": string;
    };
  };
}

export interface PresignDependencies {
  config?: R2Config;
  createSignedUrl?: (
    client: S3Client,
    command: PutObjectCommand,
    options: { expiresIn: number },
  ) => Promise<string>;
}

export interface CompleteUploadDependencies {
  config?: R2Config;
  headObject?: (
    client: S3Client,
    command: HeadObjectCommand,
  ) => Promise<HeadObjectCommandOutput>;
}

/**
 * One place to build the R2 client so every upload path behaves the same.
 *
 * - Checksums are only sent when an operation requires them. Recent AWS SDK
 *   versions attach CRC checksum headers to every PutObject by default, which
 *   S3-compatible stores such as R2 do not always accept; Cloudflare recommends
 *   this setting for SDK compatibility.
 * - Timeouts are bounded so a slow storage endpoint fails with a clear
 *   storage error well inside the function's time budget instead of the
 *   platform killing the request (which the browser reports as a dropped
 *   connection).
 */
export function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(config),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    maxAttempts: 3,
    requestHandler: {
      connectionTimeout: 5_000,
      requestTimeout: 20_000,
    },
  });
}

export interface StoreMediaObjectInput {
  body: Uint8Array;
  contentType: string;
  byteSize: number;
  fileName: string;
  purpose: AdminMediaUploadPurpose;
}

export interface StoreMediaObjectDependencies {
  config?: R2Config;
  putObject?: (client: S3Client, command: PutObjectCommand) => Promise<unknown>;
}

/**
 * Streams an admin image to R2, then records it as a READY media asset.
 *
 * The object is written first: if storage fails nothing is left behind in the
 * database, and the admin receives a storage-specific error instead of a
 * generic one. Every media asset row therefore points at an object that exists.
 */
export async function storeMediaObject(
  input: StoreMediaObjectInput,
  actor: AuthenticatedUser,
  dependencies: StoreMediaObjectDependencies = {},
) {
  const config = dependencies.config ?? getR2Config();
  const objectKey = createMediaObjectKey({
    contentType: input.contentType,
    purpose: input.purpose,
  });
  const client = createR2Client(config);
  const putObject =
    dependencies.putObject ?? ((r2Client, command) => r2Client.send(command));

  try {
    await putObject(
      client,
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
        Body: input.body,
        ContentType: input.contentType,
        ContentLength: input.byteSize,
      }),
    );
  } catch (error) {
    throw storageErrorFromUnknown(error);
  }

  const publicUrl = getPublicMediaUrl(config, objectKey);
  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      bucket: config.bucketName,
      objectKey,
      publicUrl,
      originalFilename: input.fileName,
      contentType: input.contentType,
      byteSize: input.byteSize,
      // The database enum only models product images; the purpose that decides
      // the storage folder is recorded in the audit log below.
      uploadPurpose: MediaUploadPurpose.PRODUCT_IMAGE,
      status: MediaAssetStatus.READY,
      createdByUserId: actor.id,
    },
    select: { id: true, publicUrl: true, status: true },
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "MEDIA_UPLOAD_COMPLETED",
    targetType: "media_asset",
    targetId: mediaAsset.id,
    metadata: {
      objectKey,
      contentType: input.contentType,
      byteSize: input.byteSize,
      purpose: input.purpose,
    },
  });

  return mediaAsset;
}

function notFound(): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: "Media asset not found.",
    status: 404,
  });
}

function invalidMediaUpload(
  message: string,
  metadata?: Record<string, unknown>,
): AppError {
  return new AppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    publicMessage: message,
    status: 400,
    fieldErrors: {
      mediaAssetId: [message],
    },
    cause: metadata,
  });
}

export function createMediaObjectKey(
  input: {
    contentType: string;
    purpose: AdminMediaUploadPurpose;
  },
): string {
  const extension = extensionByContentType[input.contentType] ?? "bin";
  const datePrefix = new Date().toISOString().slice(0, 10);
  const directoryByPurpose: Record<AdminMediaUploadPurpose, string> = {
    PRODUCT_IMAGE: "product-images",
    CAROUSEL_BANNER: "carousel-banners",
    SALE_CARD_IMAGE: "sale-card-images",
    MENU_BOARD: "menu-boards",
  };

  return `${directoryByPurpose[input.purpose]}/${datePrefix}/${randomUUID()}.${extension}`;
}

export async function createPresignedProductImageUpload(
  input: PresignedUploadRequestInput,
  actor: AuthenticatedUser,
  dependencies: PresignDependencies = {},
): Promise<SignedUploadResult> {
  const config = dependencies.config ?? getR2Config();
  const objectKey = createMediaObjectKey(input);
  const client = createR2Client(config);
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: objectKey,
    ContentType: input.contentType,
    ContentLength: input.byteSize,
  });
  const createSignedUrl = dependencies.createSignedUrl ?? getSignedUrl;
  const uploadUrl = await createSignedUrl(client, command, {
    expiresIn: config.expiresInSeconds,
  });
  const publicUrl = getPublicMediaUrl(config, objectKey);

  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      bucket: config.bucketName,
      objectKey,
      publicUrl,
      originalFilename: input.fileName,
      contentType: input.contentType,
      byteSize: input.byteSize,
      uploadPurpose: input.purpose,
      createdByUserId: actor.id,
    },
    select: {
      id: true,
      objectKey: true,
      publicUrl: true,
      status: true,
    },
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "MEDIA_UPLOAD_URL_CREATED",
    targetType: "media_asset",
    targetId: mediaAsset.id,
    metadata: {
      objectKey,
      contentType: input.contentType,
      byteSize: input.byteSize,
      purpose: input.purpose,
    },
  });

  return {
    mediaAsset,
    upload: {
      method: "PUT",
      url: uploadUrl,
      expiresInSeconds: config.expiresInSeconds,
      headers: {
        "content-type": input.contentType,
      },
    },
  };
}

export async function completeMediaAssetUpload(
  mediaAssetId: string,
  actor: AuthenticatedUser,
  dependencies: CompleteUploadDependencies = {},
) {
  const mediaAsset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
  });

  if (!mediaAsset) {
    throw notFound();
  }

  if (mediaAsset.status === MediaAssetStatus.READY) {
    return mediaAsset;
  }

  if (mediaAsset.status !== MediaAssetStatus.PENDING_UPLOAD) {
    throw invalidMediaUpload("Only pending uploads can be completed.");
  }

  const config = dependencies.config ?? getR2Config();
  const client = createR2Client(config);
  const headObject = dependencies.headObject ?? ((r2Client, command) =>
    r2Client.send(command));
  let objectMetadata: HeadObjectCommandOutput;

  try {
    objectMetadata = await headObject(
      client,
      new HeadObjectCommand({
        Bucket: mediaAsset.bucket,
        Key: mediaAsset.objectKey,
      }),
    );
  } catch (error) {
    await writeAuditLog({
      actorUserId: actor.id,
      action: "MEDIA_UPLOAD_VERIFICATION_FAILED",
      targetType: "media_asset",
      targetId: mediaAsset.id,
      metadata: {
        objectKey: mediaAsset.objectKey,
        reason: "OBJECT_NOT_FOUND",
      },
    });

    throw invalidMediaUpload("Uploaded object could not be verified.", {
      error,
    });
  }

  const actualByteSize = objectMetadata.ContentLength;
  const actualContentType = objectMetadata.ContentType;

  if (
    actualByteSize !== mediaAsset.byteSize ||
    actualContentType !== mediaAsset.contentType
  ) {
    await writeAuditLog({
      actorUserId: actor.id,
      action: "MEDIA_UPLOAD_VERIFICATION_FAILED",
      targetType: "media_asset",
      targetId: mediaAsset.id,
      metadata: {
        objectKey: mediaAsset.objectKey,
        expected: {
          byteSize: mediaAsset.byteSize,
          contentType: mediaAsset.contentType,
        },
        actual: {
          byteSize: actualByteSize ?? null,
          contentType: actualContentType ?? null,
        },
      },
    });

    throw invalidMediaUpload("Uploaded object metadata does not match.");
  }

  const publicUrl = getPublicMediaUrl(config, mediaAsset.objectKey);

  return prisma.$transaction(async (transaction) => {
    const completedMediaAsset = await transaction.mediaAsset.update({
      where: { id: mediaAssetId },
      data: {
        status: MediaAssetStatus.READY,
        publicUrl,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "MEDIA_UPLOAD_COMPLETED",
        targetType: "media_asset",
        targetId: mediaAssetId,
        metadata: {
          objectKey: mediaAsset.objectKey,
          byteSize: mediaAsset.byteSize,
          contentType: mediaAsset.contentType,
        },
      },
      transaction,
    );

    return completedMediaAsset;
  });
}

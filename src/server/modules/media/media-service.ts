import { randomUUID } from "node:crypto";
import {
  HeadObjectCommand,
  type HeadObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MediaAssetStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import type { PresignedUploadRequestInput } from "./media-schemas";
import { getPublicMediaUrl, getR2Config, getR2Endpoint } from "./r2-config";
import type { R2Config } from "./r2-config";

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

function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(config),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
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
  input: Pick<PresignedUploadRequestInput, "contentType">,
): string {
  const extension = extensionByContentType[input.contentType] ?? "bin";
  const datePrefix = new Date().toISOString().slice(0, 10);

  return `product-images/${datePrefix}/${randomUUID()}.${extension}`;
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

import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MediaAssetStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";
import type { AuthenticatedUser } from "@/server/auth/rbac";
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
  publicUrl?: string,
) {
  const mediaAsset = await prisma.mediaAsset.update({
    where: { id: mediaAssetId },
    data: {
      status: MediaAssetStatus.READY,
      publicUrl,
    },
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "MEDIA_UPLOAD_COMPLETED",
    targetType: "media_asset",
    targetId: mediaAssetId,
    metadata: {
      objectKey: mediaAsset.objectKey,
    },
  });

  return mediaAsset;
}

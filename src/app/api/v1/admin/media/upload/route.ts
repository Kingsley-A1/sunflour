import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MediaAssetStatus, MediaUploadPurpose } from "@/generated/prisma/enums";
import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import { ALLOWED_IMAGE_CONTENT_TYPES, MAX_PRODUCT_IMAGE_BYTES } from "@/server/modules/media/media-schemas";
import { createMediaObjectKey } from "@/server/modules/media/media-service";
import { getPublicMediaUrl, getR2Config, getR2Endpoint } from "@/server/modules/media/r2-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AllowedImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

function isAllowedImageContentType(
  contentType: string,
): contentType is AllowedImageContentType {
  return (ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(contentType);
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(PRODUCT_CONTENT_ROLES);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError({
        code: ERROR_CODES.VALIDATION_ERROR,
        publicMessage: "No file provided.",
        status: 400,
      });
    }

    const { type: contentType, size, name: fileName } = file;

    if (!isAllowedImageContentType(contentType)) {
      throw new AppError({
        code: ERROR_CODES.VALIDATION_ERROR,
        publicMessage: "File type not allowed. Use JPEG, PNG, WebP, or AVIF.",
        status: 400,
      });
    }

    if (size > MAX_PRODUCT_IMAGE_BYTES) {
      throw new AppError({
        code: ERROR_CODES.VALIDATION_ERROR,
        publicMessage: `File too large. Maximum is ${MAX_PRODUCT_IMAGE_BYTES / 1024 / 1024} MB.`,
        status: 400,
      });
    }

    const config = getR2Config();
    const objectKey = createMediaObjectKey({ contentType });

    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        bucket: config.bucketName,
        objectKey,
        publicUrl: null,
        originalFilename: fileName,
        contentType,
        byteSize: size,
        uploadPurpose: MediaUploadPurpose.PRODUCT_IMAGE,
        createdByUserId: actor.id,
      },
      select: { id: true, objectKey: true, status: true },
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const r2 = new S3Client({
      region: "auto",
      endpoint: getR2Endpoint(config),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    await r2.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
        ContentLength: size,
      }),
    );

    const publicUrl = getPublicMediaUrl(config, objectKey);
    const completed = await prisma.mediaAsset.update({
      where: { id: mediaAsset.id },
      data: { status: MediaAssetStatus.READY, publicUrl },
      select: { id: true, publicUrl: true, status: true },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      action: "MEDIA_UPLOAD_COMPLETED",
      targetType: "media_asset",
      targetId: mediaAsset.id,
      metadata: { objectKey, contentType, byteSize: size },
    });

    return apiSuccess({ mediaAsset: completed }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

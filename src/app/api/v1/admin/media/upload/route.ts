import { MediaUploadPurpose } from "@/generated/prisma/enums";
import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  adminMediaUploadPurposeSchema,
  MAX_SERVER_UPLOAD_BYTES,
} from "@/server/modules/media/media-schemas";
import { storeMediaObject } from "@/server/modules/media/media-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type AllowedImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

function isAllowedImageContentType(
  contentType: string,
): contentType is AllowedImageContentType {
  return (ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(contentType);
}

function validationError(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    publicMessage: message,
    status: 400,
  });
}

async function readUploadForm(request: Request): Promise<FormData> {
  try {
    return await request.formData();
  } catch (error) {
    // A truncated or malformed multipart body. Say so instead of a generic 500.
    throw new AppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      publicMessage:
        "The image arrived incomplete. Retry the upload; if it keeps failing, try a smaller image.",
      status: 400,
      cause: error,
    });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(PRODUCT_CONTENT_ROLES);
    const formData = await readUploadForm(request);
    const file = formData.get("file");
    const purposeResult = adminMediaUploadPurposeSchema.safeParse(
      formData.get("purpose") ?? MediaUploadPurpose.PRODUCT_IMAGE,
    );

    if (!(file instanceof File)) {
      throw validationError("No file provided.");
    }

    if (!purposeResult.success) {
      throw validationError("Choose a valid image purpose.");
    }

    if (!isAllowedImageContentType(file.type)) {
      throw validationError("File type not allowed. Use JPEG, PNG, WebP, or AVIF.");
    }

    if (file.size < 1) {
      throw validationError("The image file is empty. Choose it again.");
    }

    if (file.size > MAX_SERVER_UPLOAD_BYTES) {
      throw validationError(
        `Image too large after compression. Maximum is ${MAX_SERVER_UPLOAD_BYTES / 1024 / 1024} MB.`,
      );
    }

    const mediaAsset = await storeMediaObject(
      {
        body: new Uint8Array(await file.arrayBuffer()),
        contentType: file.type,
        byteSize: file.size,
        fileName: file.name.slice(0, 180) || "image",
        purpose: purposeResult.data,
      },
      actor,
    );

    return apiSuccess({ mediaAsset }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

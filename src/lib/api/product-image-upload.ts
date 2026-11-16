import { compressImage } from "@/lib/api/image-compression";

export const MAX_PRODUCT_IMAGES = 8;
export type AdminImageUploadPurpose =
  | "PRODUCT_IMAGE"
  | "CAROUSEL_BANNER"
  | "SALE_CARD_IMAGE"
  | "MENU_BOARD";

// Generous per-image ceiling. On a slow connection a large request can stall
// long enough to be dropped; we abort and retry rather than hang forever.
const UPLOAD_TIMEOUT_MS = 90_000;
const MAX_ATTEMPTS = 3;

/**
 * The hosting platform rejects request bodies above ~4.5 MB before the upload
 * route runs, and the browser then reports a dropped connection that looks
 * exactly like a network problem. Keep every upload under this ceiling.
 * Mirrors MAX_SERVER_UPLOAD_BYTES on the server.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export type ImageUploadFailureKind =
  | "offline"
  | "connection"
  | "timeout"
  | "too-large"
  | "unsupported"
  | "storage"
  | "storage-config"
  | "permission"
  | "server"
  | "rejected";

/**
 * An upload failure that says where it actually failed. Only "offline",
 * "connection" and "timeout" are about the admin's network; storage failures
 * are reported as storage failures.
 */
export class ImageUploadError extends Error {
  readonly kind: ImageUploadFailureKind;
  readonly retryable: boolean;

  constructor(kind: ImageUploadFailureKind, message: string, retryable: boolean) {
    super(message);
    this.name = "ImageUploadError";
    this.kind = kind;
    this.retryable = retryable;
  }
}
export interface UploadedProductImage {
  mediaAssetId: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface UploadedImageResult {
  mediaAssetId: string;
  url: string;
}

export function buildProductImageAltText(
  productName: string,
  index: number,
  total: number,
): string {
  const name = productName.trim() || "Sunflour Bakery product";
  return total > 1 ? `${name} — view ${index + 1}` : name;
}

interface UploadedMediaAsset {
  id: string;
  publicUrl: string | null;
}

interface UploadResponseBody {
  ok: boolean;
  data?: { mediaAsset: UploadedMediaAsset };
  error?: { code?: string; message?: string };
}

function megabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function describeUnsupported(file: File): string {
  const name = file.name || "This file";
  const isHeic = /\.(heic|heif)$/i.test(file.name) || /hei[cf]/i.test(file.type);

  return isHeic
    ? `${name} is an iPhone HEIC photo, which this browser cannot convert. Change the camera format to "Most Compatible" or export it as JPEG, then choose it again.`
    : `${name} is not a supported image. Use JPEG, PNG, WebP, or AVIF.`;
}

/**
 * Shrinks an image until it fits under the upload ceiling. Most photos fit
 * after the first pass; very detailed images get a second, stronger pass.
 */
async function prepareImageForUpload(
  file: File,
  purpose: AdminImageUploadPurpose,
): Promise<File> {
  // Menu boards are mostly small print, so keep more resolution and quality.
  const passes =
    purpose === "MENU_BOARD"
      ? [
          { maxDimension: 2000, quality: 0.85 },
          { maxDimension: 1600, quality: 0.75 },
        ]
      : [{}, { maxDimension: 1024, quality: 0.6 }];

  let prepared = file;
  for (const options of passes) {
    prepared = await compressImage(file, options);
    if (prepared.size <= MAX_UPLOAD_BYTES) {
      break;
    }
  }

  if (!ALLOWED_UPLOAD_TYPES.has(prepared.type)) {
    throw new ImageUploadError("unsupported", describeUnsupported(file), false);
  }

  if (prepared.size > MAX_UPLOAD_BYTES) {
    throw new ImageUploadError(
      "too-large",
      `${file.name || "This image"} is ${megabytes(prepared.size)} even after compression. The limit is ${megabytes(MAX_UPLOAD_BYTES)}. Use a smaller photo or a screenshot of it.`,
      false,
    );
  }

  return prepared;
}

function errorFromResponse(
  response: Response,
  payload: UploadResponseBody | null,
): ImageUploadError {
  const code = payload?.error?.code;
  const message = payload?.error?.message;

  if (code === "STORAGE_UNAVAILABLE") {
    return new ImageUploadError("storage", message ?? "Image storage is not responding. Retry the image.", true);
  }

  if (code === "STORAGE_MISCONFIGURED") {
    return new ImageUploadError("storage-config", message ?? "Image storage is misconfigured.", false);
  }

  if (code === "STORAGE_UPLOAD_FAILED") {
    return new ImageUploadError("storage", message ?? "Image storage refused the upload.", true);
  }

  if (response.status === 401 || response.status === 403) {
    return new ImageUploadError(
      "permission",
      message ?? "Your admin session has expired or lacks permission. Sign in again, then retry.",
      false,
    );
  }

  if (response.status === 413) {
    return new ImageUploadError(
      "too-large",
      "The hosting platform rejected this image as too large. Use a smaller photo.",
      false,
    );
  }

  if (response.status === 408 || response.status === 504) {
    return new ImageUploadError(
      "timeout",
      "The server took too long to store the image. Retry the image.",
      true,
    );
  }

  if (response.status >= 500) {
    return new ImageUploadError(
      "server",
      message && message !== "Something went wrong. Try again."
        ? message
        : `The server could not store the image (error ${response.status}). Retry the image.`,
      true,
    );
  }

  return new ImageUploadError(
    "rejected",
    message ?? `The image was rejected (error ${response.status}). Try a different image.`,
    false,
  );
}

async function sendUpload(
  file: File,
  purpose: AdminImageUploadPurpose,
): Promise<UploadedMediaAsset> {
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", purpose);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch("/api/v1/admin/media/upload", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new ImageUploadError(
        "timeout",
        "The upload took longer than 90 seconds and was stopped. Retry the image, or switch to a stronger connection.",
        true,
      );
    }

    throw isOffline()
      ? new ImageUploadError("offline", "You are offline. Reconnect, then retry the image.", true)
      : new ImageUploadError(
          "connection",
          "The upload connection dropped before the server replied. Retry the image.",
          true,
        );
  } finally {
    clearTimeout(timer);
  }

  const payload = (await response.json().catch(() => null)) as UploadResponseBody | null;

  if (response.ok && payload?.ok && payload.data?.mediaAsset?.id) {
    return payload.data.mediaAsset;
  }

  throw errorFromResponse(response, payload);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Uploads a single file through the same-origin media route. The route streams
// the file to R2 server-side, so the browser never makes a cross-origin request
// (no R2 CORS configuration required). The image is downscaled first to keep
// the payload small; only transient failures are retried, with a short backoff.
async function uploadThroughServer(
  file: File,
  purpose: AdminImageUploadPurpose = "PRODUCT_IMAGE",
): Promise<UploadedMediaAsset> {
  const prepared = await prepareImageForUpload(file, purpose);
  let lastError: ImageUploadError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await sendUpload(prepared, purpose);
    } catch (error) {
      if (!(error instanceof ImageUploadError)) {
        throw error;
      }

      lastError = error;

      if (!error.retryable || error.kind === "offline" || attempt === MAX_ATTEMPTS) {
        break;
      }

      await wait(attempt * 1_500);
    }
  }

  throw lastError ?? new ImageUploadError("server", "Image upload failed. Retry the image.", true);
}

/**
 * Uploads one product image and returns the stored media asset. Used by the
 * product editor, which uploads each image as soon as it is chosen.
 */
export async function uploadProductImage(
  file: File,
): Promise<{ mediaAssetId: string; url: string | null }> {
  const mediaAsset = await uploadThroughServer(file, "PRODUCT_IMAGE");

  return { mediaAssetId: mediaAsset.id, url: mediaAsset.publicUrl };
}

/**
 * Uploads a single image and returns its public URL. Used by surfaces that
 * store an image URL string (such as the tabular menu) rather than a product
 * image relation.
 */
export async function uploadSingleAdminImage(
  file: File,
  purpose: AdminImageUploadPurpose = "PRODUCT_IMAGE",
): Promise<UploadedImageResult> {
  const mediaAsset = await uploadThroughServer(file, purpose);

  if (!mediaAsset.publicUrl) {
    throw new Error(
      "Uploaded image has no public URL. Configure the media public base URL, or paste an image URL instead.",
    );
  }

  return {
    mediaAssetId: mediaAsset.id,
    url: mediaAsset.publicUrl,
  };
}

export async function uploadProductImageFiles(
  files: File[],
  productName: string,
  makeFirstPrimary = true,
  sortOrderOffset = 0,
): Promise<UploadedProductImage[]> {
  if (files.length < 1 || files.length > MAX_PRODUCT_IMAGES) {
    throw new Error(`Choose between 1 and ${MAX_PRODUCT_IMAGES} product images.`);
  }

  // Upload one at a time so a single weak connection is not split across
  // several concurrent requests (which makes each more likely to stall).
  const uploaded: UploadedProductImage[] = [];
  for (const [index, file] of files.entries()) {
    const mediaAsset = await uploadThroughServer(file, "PRODUCT_IMAGE");
    uploaded.push({
      mediaAssetId: mediaAsset.id,
      altText: buildProductImageAltText(productName, index, files.length),
      isPrimary: makeFirstPrimary && index === 0,
      sortOrder: sortOrderOffset + index,
    });
  }

  return uploaded;
}

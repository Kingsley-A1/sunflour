import { compressImage } from "@/lib/api/image-compression";

export const MAX_PRODUCT_IMAGES = 8;

// Generous per-image ceiling. On a slow connection a large request can stall
// long enough to be dropped; we abort and retry rather than hang forever.
const UPLOAD_TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 2;

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

// Uploads a single file through the same-origin media route. The route streams
// the file to R2 server-side, so the browser never makes a cross-origin request
// (no R2 CORS configuration required). The image is downscaled first to keep the
// payload small, and transient network failures are retried once.
async function uploadThroughServer(file: File): Promise<UploadedMediaAsset> {
  const optimized = await compressImage(file);
  let lastError: Error = new Error("Image upload failed. Try again.");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const form = new FormData();
    form.append("file", optimized);

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
      clearTimeout(timer);
      lastError = new Error(
        controller.signal.aborted
          ? "The image upload timed out. On a slow connection, try a smaller image or switch to Wi-Fi."
          : "Network error while uploading the image. Check your connection and try again.",
      );
      continue; // transient — retry
    }
    clearTimeout(timer);

    const payload = (await response.json().catch(() => null)) as {
      ok: boolean;
      data?: { mediaAsset: UploadedMediaAsset };
      error?: { message: string };
    } | null;

    if (response.ok && payload?.ok && payload.data?.mediaAsset?.id) {
      return payload.data.mediaAsset;
    }

    // The server responded with an error (validation, permission, storage).
    // Retrying will not help, so stop and surface the real reason.
    throw new Error(
      payload?.error?.message ?? "Image upload failed. Try a different image.",
    );
  }

  throw lastError;
}

/**
 * Uploads a single image and returns its public URL. Used by surfaces that
 * store an image URL string (such as the tabular menu) rather than a product
 * image relation.
 */
export async function uploadSingleAdminImage(
  file: File,
): Promise<UploadedImageResult> {
  const mediaAsset = await uploadThroughServer(file);

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
): Promise<UploadedProductImage[]> {
  if (files.length < 1 || files.length > MAX_PRODUCT_IMAGES) {
    throw new Error(`Choose between 1 and ${MAX_PRODUCT_IMAGES} product images.`);
  }

  // Upload one at a time so a single weak connection is not split across
  // several concurrent requests (which makes each more likely to stall).
  const uploaded: UploadedProductImage[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const mediaAsset = await uploadThroughServer(files[index]);
    uploaded.push({
      mediaAssetId: mediaAsset.id,
      altText: buildProductImageAltText(productName, index, files.length),
      isPrimary: index === 0,
      sortOrder: index,
    });
  }

  return uploaded;
}

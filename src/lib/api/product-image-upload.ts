import { compressImage } from "@/lib/api/image-compression";

export const MAX_PRODUCT_IMAGES = 8;

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
// (no R2 CORS configuration required). Images are downscaled first to stay well
// under platform request-body limits.
async function uploadThroughServer(file: File): Promise<UploadedMediaAsset> {
  const optimized = await compressImage(file);
  const form = new FormData();
  form.append("file", optimized);

  let response: Response;
  try {
    response = await fetch("/api/v1/admin/media/upload", {
      method: "POST",
      body: form,
    });
  } catch {
    throw new Error(
      "Network error while uploading the image. Check your connection and try again.",
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    ok: boolean;
    data?: { mediaAsset: UploadedMediaAsset };
    error?: { message: string };
  } | null;

  if (!payload?.ok || !payload.data?.mediaAsset?.id) {
    throw new Error(
      payload?.error?.message ?? "Image upload failed. Try a different image.",
    );
  }

  return payload.data.mediaAsset;
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

  return Promise.all(
    files.map(async (file, index) => {
      const mediaAsset = await uploadThroughServer(file);

      return {
        mediaAssetId: mediaAsset.id,
        altText: buildProductImageAltText(productName, index, files.length),
        isPrimary: index === 0,
        sortOrder: index,
      };
    }),
  );
}

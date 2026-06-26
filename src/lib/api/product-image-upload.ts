export const MAX_PRODUCT_IMAGES = 8;

export interface UploadedProductImage {
  mediaAssetId: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export function buildProductImageAltText(
  productName: string,
  index: number,
  total: number,
): string {
  const name = productName.trim() || "Sunflour Bakery product";
  return total > 1 ? `${name} — view ${index + 1}` : name;
}

export interface UploadedImageResult {
  mediaAssetId: string;
  url: string;
}

/**
 * Uploads a single image through the signed media flow and returns its public
 * URL. Used by surfaces that store an image URL string (such as the tabular
 * menu) rather than a product image relation.
 */
export async function uploadSingleAdminImage(
  file: File,
): Promise<UploadedImageResult> {
  const presign = await presignProductImageUpload({
    fileName: file.name,
    contentType: file.type,
    byteSize: file.size,
  });
  const uploadResponse = await fetch(presign.upload.url, {
    method: presign.upload.method,
    headers: presign.upload.headers,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Image upload failed.");
  }

  await completeMediaUpload(presign.mediaAsset.id);

  if (!presign.mediaAsset.publicUrl) {
    throw new Error(
      "Uploaded image has no public URL. Configure the media public base URL, or paste an image URL instead.",
    );
  }

  return {
    mediaAssetId: presign.mediaAsset.id,
    url: presign.mediaAsset.publicUrl,
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
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/v1/admin/media/upload", {
        method: "POST",
        body: form,
      }).catch(() => {
        throw new Error(`Network error uploading image ${index + 1}.`);
      });

      const payload = (await response.json().catch(() => null)) as {
        ok: boolean;
        data?: { mediaAsset: { id: string } };
        error?: { message: string };
      } | null;

      if (!payload?.ok || !payload.data?.mediaAsset?.id) {
        throw new Error(payload?.error?.message ?? `Image ${index + 1} upload failed.`);
      }

      return {
        mediaAssetId: payload.data.mediaAsset.id,
        altText: buildProductImageAltText(productName, index, files.length),
        isPrimary: index === 0,
        sortOrder: index,
      };
    }),
  );
}

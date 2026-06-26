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

import {
  completeMediaUpload,
  presignProductImageUpload,
} from "@/lib/api/client";

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

  const uploads = await Promise.all(
    files.map(async (file, index) => {
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
        throw new Error(`Upload failed for image ${index + 1}.`);
      }

      await completeMediaUpload(presign.mediaAsset.id);

      return {
        mediaAssetId: presign.mediaAsset.id,
        altText: buildProductImageAltText(productName, index, files.length),
        isPrimary: index === 0,
        sortOrder: index,
      };
    }),
  );

  return uploads;
}

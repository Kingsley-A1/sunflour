// Browser-side image downscaling + re-encoding.
//
// Routing multi-megabyte photos through a serverless API route is the most
// common cause of "Failed to fetch" upload errors: many hosting platforms cap
// the request body (~4.5 MB on Vercel) and reset the connection before the
// route handler runs, which surfaces in the browser as a network error even on
// a fast connection. Phone photos routinely exceed that cap.
//
// Shrinking images in the browser first keeps uploads well under the limit,
// avoids any cross-origin upload path, and produces lighter images for the
// storefront. If anything fails we fall back to the original file so uploads
// still work.

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;

const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function canCompressInBrowser(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof createImageBitmap === "function" &&
    typeof HTMLCanvasElement !== "undefined"
  );
}

async function decodeBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return createImageBitmap(file);
  }
}

export async function compressImage(file: File): Promise<File> {
  if (!canCompressInBrowser() || !COMPRESSIBLE_TYPES.has(file.type)) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeBitmap(file);
  } catch {
    return file;
  }

  try {
    const largestSide = Math.max(bitmap.width, bitmap.height);
    const scale = largestSide > MAX_DIMENSION ? MAX_DIMENSION / largestSide : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/webp", WEBP_QUALITY);
    });

    if (!blob || blob.size === 0) {
      return file;
    }

    // Keep the original when it was already smaller and not downscaled.
    if (scale === 1 && blob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^./\\]+$/, "") || "image";
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}

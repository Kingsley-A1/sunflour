// Browser-side image downscaling + re-encoding.
//
// Routing photos through an API route is fragile on slow/mobile connections:
// a multi-megabyte upload over a weak uplink can stall long enough for the
// platform or browser to drop the request, surfacing as a "network error".
// Shrinking images in the browser first makes uploads small and fast, avoids
// any cross-origin upload path, and produces lighter images for the storefront.
// If anything fails we fall back to the original file so uploads still work.

const MAX_DIMENSION = 1280;
const WEBP_QUALITY = 0.72;

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
  if (!canCompressInBrowser() || !file.type.startsWith("image/")) {
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

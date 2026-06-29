"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { attachProductImage, getApiErrorMessage } from "@/lib/api/client";
import {
  buildProductImageAltText,
  MAX_PRODUCT_IMAGES,
  uploadProductImageFiles,
} from "@/lib/api/product-image-upload";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import type { AdminProductImage } from "@/types/domain";

interface AdminUploadFieldProps {
  productName: string;
  selectedFiles: File[];
  onSelectedFilesChange: (files: File[]) => void;
  existingImages?: AdminProductImage[];
  productId?: string;
}

export function AdminUploadField({
  productName,
  selectedFiles,
  onSelectedFilesChange,
  existingImages = [],
  productId,
}: AdminUploadFieldProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const previews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles],
  );

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [previews],
  );

  function selectFiles(files: File[]) {
    setError(null);
    setMessage(null);

    if (files.length > MAX_PRODUCT_IMAGES) {
      setError(`Choose no more than ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }

    onSelectedFilesChange(files);
  }

  async function uploadImages() {
    if (!productId) {
      return;
    }

    if (selectedFiles.length < 1) {
      setError("Choose at least one image.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsUploading(true);

    try {
      const images = await uploadProductImageFiles(selectedFiles, productName);

      for (const image of images) {
        await attachProductImage({
          productId,
          ...image,
        });
      }

      onSelectedFilesChange([]);
      setMessage(
        `${images.length} ${images.length === 1 ? "image" : "images"} uploaded.`,
      );
      router.refresh();
    } catch (uploadError) {
      setError(
        getApiErrorMessage(
          uploadError,
          "Image upload failed. Check the file type, size, and your connection.",
        ),
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div>
        <h2 className="m-0 text-xl font-bold">Product images</h2>
        <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
          The first image is used on the product card.
        </p>
      </div>

      {existingImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Current product images">
          {existingImages.map((image) => (
            <article className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]" key={image.id}>
              <div className="relative aspect-[4/3] bg-[var(--color-surface-muted)]">
                {image.mediaAsset.publicUrl ? (
                  <SafeImage
                    alt={image.altText ?? productName}
                    className="object-cover"
                    fill
                    fallback={
                      <div className="grid h-full place-items-center px-3 text-center text-xs font-semibold text-[var(--color-text-muted)]">
                        Image unavailable
                      </div>
                    }
                    sizes="(min-width: 1024px) 20vw, 50vw"
                    src={image.mediaAsset.publicUrl}
                  />
                ) : null}
              </div>
              <p className="m-0 p-2 text-xs font-medium text-[var(--color-text-muted)]">
                {image.isPrimary ? "Primary image" : image.altText ?? productName}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="m-0 text-sm font-semibold text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="m-0 text-sm font-semibold text-[var(--color-success)]" role="status">
          {message}
        </p>
      ) : null}

      <Input
        accept="image/jpeg,image/png,image/webp,image/avif"
        label={productId ? "Add images" : "Select images (required)"}
        multiple
        onChange={(event) => selectFiles(Array.from(event.target.files ?? []))}
        type="file"
      />

      {previews.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Selected image previews">
          {previews.map((preview, index) => (
            <article className="relative overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]" key={`${preview.file.name}-${preview.file.lastModified}-${index}`}>
              <div className="relative aspect-[4/3] bg-[var(--color-surface-muted)]">
                {/* Local object URLs are used only for the pre-upload preview. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={buildProductImageAltText(productName, index, previews.length)}
                  className="h-full w-full object-cover"
                  src={preview.url}
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="m-0 truncate text-xs font-semibold">
                  {index === 0 ? "Primary" : `View ${index + 1}`}
                </p>
                <IconButton
                  className="h-9 w-9 shrink-0"
                  icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                  label={`Remove selected image ${index + 1}`}
                  onClick={() =>
                    onSelectedFilesChange(
                      selectedFiles.filter((_, fileIndex) => fileIndex !== index),
                    )
                  }
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-32 place-items-center rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-4 text-center">
          <div>
            <ImagePlus className="mx-auto h-6 w-6 text-[var(--color-text-muted)]" aria-hidden="true" />
            <p className="m-0 mt-2 text-sm font-semibold text-[var(--color-text-muted)]">
              Selected images will preview here.
            </p>
          </div>
        </div>
      )}

      {productId ? (
        <Button
          disabled={selectedFiles.length < 1}
          icon={<Upload className="h-4 w-4" aria-hidden="true" />}
          loading={isUploading}
          onClick={uploadImages}
          variant="secondary"
        >
          Upload selected images
        </Button>
      ) : null}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, RotateCcw, Star, Trash2 } from "lucide-react";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { PreviewImage } from "@/components/admin/preview-image";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  MAX_PRODUCT_IMAGES,
  uploadProductImage,
} from "@/lib/api/product-image-upload";
import { cn } from "@/lib/utils";
import type { ProductDraftImage } from "@/types/domain";

type ImageStatus = "queued" | "uploading" | "ready" | "error";

export interface ProductImageItem {
  key: string;
  name: string;
  status: ImageStatus;
  /** Local preview (object URL) or the stored public URL. */
  previewUrl: string | null;
  file?: File;
  mediaAssetId?: string;
  url?: string | null;
  error?: string;
}

let keySequence = 0;
function nextKey(): string {
  keySequence += 1;
  return `image-${Date.now()}-${keySequence}`;
}

function revokePreview(item: ProductImageItem) {
  if (item.file && item.previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(item.previewUrl);
  }
}

/**
 * Uploads product images as soon as they are chosen, one at a time, and keeps
 * a per-image status. Creating the product then only references images that
 * are already stored, so a failed image is retried on its own instead of
 * failing (and re-uploading) the whole product.
 */
export function useProductImageQueue(initialImages: ProductDraftImage[] = []) {
  const [items, setItemsState] = useState<ProductImageItem[]>(() =>
    initialImages.map((image, index) => ({
      key: `stored-${image.mediaAssetId}`,
      name: `Saved image ${index + 1}`,
      status: "ready" as const,
      previewUrl: image.url,
      mediaAssetId: image.mediaAssetId,
      url: image.url,
    })),
  );
  const itemsRef = useRef(items);
  const isUploadingRef = useRef(false);
  const isMountedRef = useRef(true);

  // All writes go through here so the queue can read the latest list
  // synchronously between awaits.
  const setItems = useCallback(
    (update: (current: ProductImageItem[]) => ProductImageItem[]) => {
      const next = update(itemsRef.current);
      itemsRef.current = next;
      if (isMountedRef.current) {
        setItemsState(next);
      }
    },
    [],
  );

  const patchItem = useCallback(
    (key: string, patch: Partial<ProductImageItem>) => {
      setItems((current) =>
        current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
      );
    },
    [setItems],
  );

  // Drains the queue one image at a time. Only one drain runs at once; images
  // added mid-drain are picked up by the same loop.
  const pump = useCallback(async () => {
    if (isUploadingRef.current) {
      return;
    }

    isUploadingRef.current = true;

    try {
      let next = itemsRef.current.find((item) => item.status === "queued");

      while (next?.file && isMountedRef.current) {
        const { key, file } = next;
        patchItem(key, { status: "uploading", error: undefined });

        try {
          const stored = await uploadProductImage(file);
          patchItem(key, {
            status: "ready",
            mediaAssetId: stored.mediaAssetId,
            url: stored.url,
          });
        } catch (error) {
          patchItem(key, {
            status: "error",
            error: getApiErrorMessage(error, "This image could not be uploaded."),
          });
        }

        next = itemsRef.current.find((item) => item.status === "queued");
      }
    } finally {
      isUploadingRef.current = false;
    }
  }, [patchItem]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      itemsRef.current.forEach(revokePreview);
    };
  }, []);

  function addFiles(files: File[]): string | null {
    const room = MAX_PRODUCT_IMAGES - itemsRef.current.length;

    if (room <= 0) {
      return `A product can have up to ${MAX_PRODUCT_IMAGES} images. Remove one to add another.`;
    }

    const accepted = files.slice(0, room);
    setItems((current) => [
      ...current,
      ...accepted.map((file) => ({
        key: nextKey(),
        name: file.name,
        status: "queued" as const,
        previewUrl: URL.createObjectURL(file),
        file,
      })),
    ]);
    void pump();

    return files.length > room
      ? `Only ${room} more ${room === 1 ? "image fits" : "images fit"} (limit ${MAX_PRODUCT_IMAGES}). The rest were skipped.`
      : null;
  }

  function retry(key: string) {
    patchItem(key, { status: "queued", error: undefined });
    void pump();
  }

  function retryAllFailed() {
    setItems((current) =>
      current.map((item) =>
        item.status === "error" ? { ...item, status: "queued", error: undefined } : item,
      ),
    );
    void pump();
  }

  function remove(key: string) {
    const target = itemsRef.current.find((item) => item.key === key);
    if (target) {
      revokePreview(target);
    }
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function makePrimary(key: string) {
    setItems((current) => {
      const target = current.find((item) => item.key === key);
      return target ? [target, ...current.filter((item) => item.key !== key)] : current;
    });
  }

  const readyImages: ProductDraftImage[] = items
    .filter((item) => item.status === "ready" && item.mediaAssetId)
    .map((item) => ({ mediaAssetId: item.mediaAssetId as string, url: item.url ?? null }));

  return {
    items,
    readyImages,
    pendingCount: items.filter((item) => item.status === "queued" || item.status === "uploading").length,
    failedCount: items.filter((item) => item.status === "error").length,
    addFiles,
    retry,
    retryAllFailed,
    remove,
    makePrimary,
  };
}

export type ProductImageQueue = ReturnType<typeof useProductImageQueue>;

const statusLabel: Record<ImageStatus, string> = {
  queued: "Waiting",
  uploading: "Uploading…",
  ready: "Uploaded",
  error: "Failed",
};

export function ProductImagesField({ queue }: { queue: ProductImageQueue }) {
  const [notice, setNotice] = useState<string | null>(null);
  const { items, failedCount, pendingCount } = queue;

  return (
    <section
      aria-labelledby="product-images-heading"
      className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-bold" id="product-images-heading">
            Photos
          </h2>
          <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
            Photos upload as soon as you add them. The first photo is the one
            customers see on the menu card.
          </p>
        </div>
        <p
          className="m-0 rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold tabular-nums text-[var(--color-text-muted)]"
        >
          {items.length} / {MAX_PRODUCT_IMAGES}
        </p>
      </div>

      {notice ? (
        <p className="m-0 text-sm font-semibold text-[var(--color-warning-text)]" role="status">
          {notice}
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul
          aria-label="Product photos"
          className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4"
        >
          {items.map((item, index) => (
            <li
              className={cn(
                "overflow-hidden rounded-[var(--radius-sm)] border bg-[var(--color-surface-raised)]",
                item.status === "error"
                  ? "border-[var(--color-danger)]"
                  : "border-[var(--color-border)]",
              )}
              key={item.key}
            >
              <div className="relative aspect-[4/3] bg-[var(--color-surface-muted)]">
                <PreviewImage
                  className={item.status !== "ready" ? "opacity-60" : undefined}
                  src={item.previewUrl}
                />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-[var(--radius-pill)] bg-[var(--color-surface)] px-2 py-0.5 text-xs font-bold text-[var(--color-text)] shadow-[var(--shadow-raised)]">
                    Cover
                  </span>
                ) : null}
              </div>
              <div className="grid gap-2 p-2">
                <p
                  className={cn(
                    "m-0 flex items-center gap-1.5 text-xs font-semibold",
                    item.status === "error"
                      ? "text-[var(--color-danger)]"
                      : item.status === "ready"
                        ? "text-[var(--color-success-text)]"
                        : "text-[var(--color-text-muted)]",
                  )}
                >
                  {item.status === "uploading" ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  ) : item.status === "ready" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : item.status === "error" ? (
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : null}
                  {statusLabel[item.status]}
                </p>
                {item.error ? (
                  <p className="m-0 text-xs leading-5 text-[var(--color-danger-text)]">
                    {item.error}
                  </p>
                ) : null}
                <div className="flex items-center justify-end gap-1">
                  {item.status === "error" ? (
                    <IconButton
                      className="h-9 w-9"
                      icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
                      label={`Retry photo ${index + 1}`}
                      onClick={() => queue.retry(item.key)}
                    />
                  ) : null}
                  {index > 0 ? (
                    <IconButton
                      className="h-9 w-9"
                      icon={<Star className="h-4 w-4" aria-hidden="true" />}
                      label={`Use photo ${index + 1} as cover`}
                      onClick={() => queue.makePrimary(item.key)}
                    />
                  ) : null}
                  <IconButton
                    className="h-9 w-9"
                    icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                    label={`Remove photo ${index + 1}`}
                    onClick={() => queue.remove(item.key)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {failedCount > 1 ? (
        <Button
          icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
          onClick={queue.retryAllFailed}
          size="sm"
          variant="secondary"
        >
          Retry {failedCount} failed photos
        </Button>
      ) : null}

      {items.length < MAX_PRODUCT_IMAGES ? (
        <ImageDropzone
          compact={items.length > 0}
          hint="JPEG, PNG, WebP or AVIF. Large photos are compressed automatically."
          label={items.length > 0 ? "Add more photos" : "Choose photos"}
          onFiles={(files) => setNotice(queue.addFiles(files))}
        />
      ) : null}

      <p aria-live="polite" className="sr-only">
        {pendingCount > 0 ? `${pendingCount} photos uploading.` : ""}
      </p>
    </section>
  );
}

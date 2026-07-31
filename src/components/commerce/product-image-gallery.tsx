"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { SafeImage } from "@/components/ui/safe-image";
import type { PublicProductImage } from "@/types/domain";

interface ProductImageGalleryProps {
  images: PublicProductImage[];
  productName: string;
}

const SWIPE_THRESHOLD = 48;

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const galleryImages = images;
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);
  const activeImage = galleryImages[activeIndex];

  function show(index: number) {
    if (galleryImages.length < 1) {
      return;
    }
    setActiveIndex((index + galleryImages.length) % galleryImages.length);
  }

  function finishSwipe(clientX: number) {
    if (pointerStartX.current === null) {
      return;
    }
    const delta = clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      return;
    }
    show(activeIndex + (delta < 0 ? 1 : -1));
  }

  return (
    <section aria-label={`${productName} images`} className="grid gap-3">
      <div
        className="relative aspect-[4/3] touch-pan-y overflow-hidden rounded-[var(--radius-product)] bg-[var(--color-surface-muted)]"
        onPointerDown={(event) => {
          pointerStartX.current = event.clientX;
        }}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
        onPointerUp={(event) => finishSwipe(event.clientX)}
      >
        {activeImage?.url ? (
          <SafeImage
            alt={activeImage.altText ?? productName}
            className="object-cover"
            fill
            fallback={
              <div className="grid h-full place-items-center text-lg font-bold text-[var(--color-text-muted)]">
                Image unavailable
              </div>
            }
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            src={activeImage.url}
          />
        ) : (
          <div className="grid h-full place-items-center text-lg font-bold text-[var(--color-text-muted)]">
            Sunflour Bakery
          </div>
        )}

        {galleryImages.length > 1 ? (
          <>
            <IconButton
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-[var(--color-surface-floating)] shadow-[var(--shadow-floating)]"
              icon={<ChevronLeft className="h-5 w-5" aria-hidden="true" />}
              label="Show previous product image"
              onClick={() => show(activeIndex - 1)}
            />
            <IconButton
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--color-surface-floating)] shadow-[var(--shadow-floating)]"
              icon={<ChevronRight className="h-5 w-5" aria-hidden="true" />}
              label="Show next product image"
              onClick={() => show(activeIndex + 1)}
            />
            <p className="absolute bottom-3 right-3 m-0 rounded-[var(--radius-pill)] bg-[var(--color-overlay-strong)] px-3 py-1 text-xs font-bold text-[var(--color-text-inverse)]">
              {activeIndex + 1} / {galleryImages.length}
            </p>
          </>
        ) : null}
      </div>

      {galleryImages.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Choose product image">
          {galleryImages.map((image, index) => (
            <button
              aria-label={`Show product image ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-[var(--radius-product)] border-2 bg-[var(--color-surface-muted)] ${
                activeIndex === index
                  ? "border-[var(--color-primary)]"
                  : "border-transparent"
              }`}
              key={image.id}
              onClick={() => show(index)}
              type="button"
            >
              {image.url ? (
                <SafeImage
                  alt=""
                  className="object-cover"
                  fallback={
                    <div className="h-full w-full bg-[var(--color-surface-muted)]" />
                  }
                  fill
                  sizes="80px"
                  src={image.url}
                />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

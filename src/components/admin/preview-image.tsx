"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewImageProps {
  src: string | null | undefined;
  className?: string;
  label?: string;
}

/**
 * A plain <img> for admin previews (local object URLs or stored media URLs)
 * that degrades to a calm placeholder instead of a broken-image icon.
 */
export function PreviewImage({ src, className, label = "Preview unavailable" }: PreviewImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // A server-rendered <img> can fail before React attaches onError during
  // hydration; catch that case once the element is mounted.
  useEffect(() => {
    const image = imageRef.current;
    if (image && src && image.complete && image.naturalWidth === 0) {
      setFailedSrc(src);
    }
  }, [src]);

  if (!src || failedSrc === src) {
    return (
      <div
        className={cn(
          "grid h-full w-full place-items-center gap-1 px-2 text-center text-xs font-semibold text-[var(--color-text-soft)]",
          className,
        )}
      >
        <span className="grid justify-items-center gap-1">
          <ImageOff className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={cn("h-full w-full object-cover", className)}
      onError={() => setFailedSrc(src)}
      ref={imageRef}
      src={src}
    />
  );
}

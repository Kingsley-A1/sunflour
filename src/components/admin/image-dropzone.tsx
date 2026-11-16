"use client";

import { useId, useRef, useState } from "react";
import type { DragEvent } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  label: string;
  hint: string;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif";

/**
 * Click-or-drop image picker. The native file input stays in the DOM (visually
 * hidden) so keyboard and screen-reader users get the platform picker, while
 * pointer users can drag photos straight in.
 */
export function ImageDropzone({
  label,
  hint,
  onFiles,
  disabled = false,
  compact = false,
}: ImageDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name),
    );

    if (files.length > 0) {
      onFiles(files);
    }
  }

  return (
    <div
      className={cn(
        "grid place-items-center rounded-[var(--radius-sm)] border border-dashed text-center transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]",
        compact ? "min-h-24 p-3" : "min-h-36 p-5",
        isDragging
          ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-border-strong)] bg-[var(--color-surface-muted)]",
        disabled && "opacity-60",
      )}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDrop={handleDrop}
    >
      <div className="grid justify-items-center gap-2">
        {!compact ? (
          <ImagePlus
            className="h-6 w-6 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
        ) : null}
        <label className="sr-only" htmlFor={inputId}>
          {label}
        </label>
        <input
          accept={ACCEPTED_TYPES}
          className="sr-only"
          disabled={disabled}
          id={inputId}
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            // Reset so choosing the same file again still fires onChange.
            event.target.value = "";
            if (files.length > 0) {
              onFiles(files);
            }
          }}
          ref={inputRef}
          tabIndex={-1}
          type="file"
        />
        <p className="m-0 text-sm font-semibold text-[var(--color-text)]">
          <span className="hidden sm:inline">Drag photos here, or </span>
          <span className="sm:hidden">Add photos from your device</span>
        </p>
        <Button
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          size="sm"
          variant="secondary"
        >
          {label}
        </Button>
        <p className="m-0 text-xs text-[var(--color-text-muted)]">{hint}</p>
      </div>
    </div>
  );
}

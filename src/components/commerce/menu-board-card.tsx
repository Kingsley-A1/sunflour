"use client";

import Image from "next/image";
import { useRef } from "react";
import { Expand, X } from "lucide-react";
import type { MenuBoard } from "@/types/domain";

interface MenuBoardCardProps {
  board: MenuBoard;
  isMain?: boolean;
}

// Tapping a board opens it in a native <dialog>. The browser provides the
// focus trap, Escape-to-close and the ::backdrop, so no extra JS is needed for
// those; we only call showModal()/close().
export function MenuBoardCard({ board, isMain = false }: MenuBoardCardProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <figure className="m-0 grid gap-2">
      <button
        aria-label={`View ${board.title} full screen`}
        className="group relative block w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-left shadow-[var(--shadow-raised)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <Image
          alt={board.altText}
          className="h-auto w-full"
          height={board.height}
          priority={isMain}
          sizes={isMain ? "(min-width: 768px) 42rem, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          src={board.imageUrl}
          style={{ aspectRatio: `${board.width} / ${board.height}` }}
          width={board.width}
        />
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
          <Expand className="h-3.5 w-3.5" aria-hidden="true" />
          Tap to zoom
        </span>
      </button>
      <figcaption className="text-sm font-semibold text-[var(--color-text)]">
        {board.title}
      </figcaption>

      <dialog
        aria-label={board.title}
        className="m-auto max-h-[100dvh] w-full max-w-3xl bg-transparent p-0 backdrop:bg-black/80 transition-opacity duration-200 open:starting:opacity-0"
        onClick={(event) => {
          // A click on the dialog box itself (not its children) is a backdrop click.
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        ref={dialogRef}
      >
        <div className="relative max-h-[100dvh] overflow-auto p-3">
          <button
            aria-label="Close"
            autoFocus
            className="sticky top-0 ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/75 text-white"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <Image
            alt={board.altText}
            className="mt-2 h-auto w-full rounded-[var(--radius-md)]"
            height={board.height}
            sizes="(min-width: 768px) 48rem, 100vw"
            src={board.imageUrl}
            width={board.width}
          />
        </div>
      </dialog>
    </figure>
  );
}

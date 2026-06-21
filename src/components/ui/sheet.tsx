"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useModalFocus } from "@/components/ui/modal-focus";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  panelClassName?: string;
}

export function Sheet({
  open,
  title,
  children,
  onClose,
  panelClassName,
}: SheetProps) {
  const titleId = useId();
  const { containerRef, isMounted, onKeyDown } =
    useModalFocus<HTMLElement>(open, onClose);

  if (!open || !isMounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--layer-overlay)] bg-[var(--color-overlay)]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "ml-auto flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface-floating)] shadow-[var(--shadow-modal)]",
          panelClassName,
        )}
        onKeyDown={onKeyDown}
        ref={containerRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-floating)] p-4">
          <h2 className="m-0 text-lg font-bold" id={titleId}>
            {title}
          </h2>
          <IconButton
            icon={<X className="h-5 w-5" aria-hidden="true" />}
            label="Close panel"
            onClick={onClose}
          />
        </div>
        <div className="p-4">{children}</div>
      </section>
    </div>,
    document.body,
  );
}

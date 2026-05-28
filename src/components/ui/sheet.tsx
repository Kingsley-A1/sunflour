"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

interface SheetProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Sheet({ open, title, children, onClose }: SheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/45" role="presentation">
      <section
        aria-labelledby="sheet-title"
        aria-modal="true"
        className="ml-auto flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)]"
        role="dialog"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="m-0 text-lg font-bold" id="sheet-title">
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
    </div>
  );
}

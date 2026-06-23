"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useModalFocus } from "@/components/ui/modal-focus";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const { containerRef, isMounted, onKeyDown } =
    useModalFocus<HTMLDivElement>(open, onCancel);

  if (!open || !isMounted) {
    return null;
  }

  return createPortal(
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[var(--layer-modal)] grid place-items-center bg-[var(--color-overlay)] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
      role="dialog"
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-floating)] p-5 shadow-[var(--shadow-modal)]"
        onKeyDown={onKeyDown}
        ref={containerRef}
        tabIndex={-1}
      >
        <div className="grid gap-3">
          <h2 className="m-0 text-xl font-bold" id={titleId}>
            {title}
          </h2>
          <p
            className="m-0 text-sm leading-6 text-[var(--color-text-muted)]"
            id={descriptionId}
          >
            {description}
          </p>
          {children}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              loading={loading}
              variant={destructive ? "danger" : "primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

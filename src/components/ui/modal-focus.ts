"use client";

import { useCallback, useEffect, useRef } from "react";
import type { KeyboardEvent, RefObject } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface ModalFocusResult<T extends HTMLElement> {
  containerRef: RefObject<T | null>;
  isMounted: boolean;
  onKeyDown: (event: KeyboardEvent<T>) => void;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    .filter((element) => !element.hasAttribute("aria-hidden"));
}

export function useModalFocus<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
): ModalFocusResult<T> {
  const containerRef = useRef<T | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isMounted = typeof document !== "undefined";

  useEffect(() => {
    if (!open || !isMounted) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      const container = containerRef.current;
      const firstFocusable = container
        ? getFocusableElements(container)[0]
        : null;

      (firstFocusable ?? container)?.focus();
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isMounted, open]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<T>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const container = containerRef.current;

      if (!container) {
        return;
      }

      const focusableElements = getFocusableElements(container);

      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [onClose],
  );

  return {
    containerRef,
    isMounted,
    onKeyDown,
  };
}

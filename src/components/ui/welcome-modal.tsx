"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import logoAsset from "../../../public/logo.png";
import { useModalFocus } from "@/components/ui/modal-focus";

const STORAGE_KEY = "sf-welcome-seen-at";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const AUTO_CLOSE_MS = 3000;

// Session store. Eligibility is read from localStorage once per page load and
// cached so useSyncExternalStore stays stable. PublicShell persists across
// public-page navigations, so the modal greets a visitor once per load.
const listeners = new Set<() => void>();
let decided = false;
let eligible = false;
let dismissed = false;

function computeEligible(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const seenAt = Number(raw);
    if (!Number.isFinite(seenAt)) return true;
    return Date.now() - seenAt > COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markWelcomeSeen(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore write failures; the cooldown simply won't persist.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  if (!decided) {
    decided = true;
    eligible = computeEligible();
  }
  return eligible && !dismissed;
}

function getServerSnapshot(): boolean {
  return false;
}

function dismissWelcome(): void {
  dismissed = true;
  markWelcomeSeen();
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Lightweight first-visit welcome modal. Greets the visitor once, auto-closes
 * after 3s (the timer pauses if they hover/focus it, per WCAG timing), and then
 * stays quiet for a 7-day cooldown tracked in localStorage. Renders nothing on
 * the server / first client paint so there is no hydration mismatch.
 */
export function WelcomeModal() {
  const show = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [paused, setPaused] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const { containerRef, isMounted, onKeyDown } = useModalFocus<HTMLDivElement>(
    show,
    dismissWelcome,
  );

  useEffect(() => {
    if (show) {
      // Start the cooldown as soon as the visitor has actually seen the modal.
      markWelcomeSeen();
    }
  }, [show]);

  useEffect(() => {
    if (!show || paused) {
      return;
    }

    const timer = setTimeout(dismissWelcome, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [show, paused]);

  if (!show || !isMounted) {
    return null;
  }

  return createPortal(
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[var(--layer-modal)] grid place-items-center bg-[var(--color-overlay)] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          dismissWelcome();
        }
      }}
      role="dialog"
    >
      <div
        className="sf-motion-scale relative w-full max-w-sm overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-floating)] text-center shadow-[var(--shadow-modal)]"
        onFocusCapture={() => setPaused(true)}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setPaused(true)}
        ref={containerRef}
        tabIndex={-1}
      >
        <button
          aria-label="Close welcome message"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-surface)]/70 text-[var(--color-text-muted)] backdrop-blur transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          onClick={dismissWelcome}
          type="button"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="relative overflow-hidden px-6 pb-8 pt-10">
          <div
            aria-hidden="true"
            className="sf-surface-gradient pointer-events-none absolute inset-x-0 top-0 h-28"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-[var(--radius-pill)] bg-[image:var(--gradient-glow-accent)] opacity-70 blur-2xl"
          />
          <div className="relative">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-raised)]">
              <Image
                alt="Sunflour Bakery"
                className="h-14 w-14 object-contain"
                height={56}
                priority
                src={logoAsset}
                width={56}
              />
            </span>
            <p className="m-0 mt-4 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
              Freshly baked for you
            </p>
            <h2 className="m-0 mt-1 text-2xl font-extrabold" id={titleId}>
              Welcome to Sunflour Bakery
            </h2>
            <p
              className="m-0 mx-auto mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-muted)]"
              id={descriptionId}
            >
              Fresh cakes, breads &amp; pastries — order online in Calabar for
              pickup or doorstep delivery.
            </p>
            <Link
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-6 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-raised)] transition hover:bg-[var(--color-primary-hover)]"
              href="/menu"
              onClick={dismissWelcome}
            >
              Browse the menu
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

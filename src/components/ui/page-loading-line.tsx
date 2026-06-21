"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PROGRESS_STEPS = [34, 58, 76, 88];
const STEP_INTERVAL_MS = 180;
const COMPLETE_DELAY_MS = 180;
const STALE_NAVIGATION_MS = 10_000;

interface NavigationIntent {
  altKey?: boolean;
  button?: number;
  ctrlKey?: boolean;
  currentHref: string;
  defaultPrevented?: boolean;
  destinationHref: string;
  download?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: string;
}

export function shouldStartNavigation(intent: NavigationIntent) {
  if (
    intent.defaultPrevented ||
    intent.button !== 0 ||
    intent.metaKey ||
    intent.ctrlKey ||
    intent.shiftKey ||
    intent.altKey ||
    intent.download ||
    (intent.target && intent.target !== "_self")
  ) {
    return false;
  }

  const destination = new URL(intent.destinationHref, intent.currentHref);
  const current = new URL(intent.currentHref);

  return (
    destination.origin === current.origin &&
    destination.href !== current.href &&
    !(destination.pathname === current.pathname &&
      destination.search === current.search &&
      destination.hash)
  );
}

export function PageLoadingLine() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = `${pathname}?${searchParams.toString()}`;
  const previousLocation = useRef(location);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function startProgress(event: MouseEvent) {
      const target = event.target;
      const anchor = target instanceof Element ? target.closest("a") : null;

      if (
        !anchor ||
        !shouldStartNavigation({
          altKey: event.altKey,
          button: event.button,
          ctrlKey: event.ctrlKey,
          currentHref: window.location.href,
          defaultPrevented: event.defaultPrevented,
          destinationHref: anchor.href,
          download: anchor.hasAttribute("download"),
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          target: anchor.target,
        })
      ) {
        return;
      }

      setProgress(12);
      setVisible(true);
    }

    document.addEventListener("click", startProgress, true);
    return () => document.removeEventListener("click", startProgress, true);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let step = 0;
    const interval = window.setInterval(() => {
      const nextProgress = PROGRESS_STEPS[step];

      if (nextProgress === undefined) {
        window.clearInterval(interval);
        return;
      }

      setProgress(nextProgress);
      step += 1;
    }, STEP_INTERVAL_MS);

    const staleTimeout = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, STALE_NAVIGATION_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(staleTimeout);
    };
  }, [visible]);

  useEffect(() => {
    if (previousLocation.current === location) {
      return;
    }

    previousLocation.current = location;
    setProgress(100);

    const timeout = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, COMPLETE_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [location]);

  return (
    <div
      aria-label="Loading page"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progress}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[var(--layer-loading)] h-1 transition-opacity duration-[var(--motion-duration-fast)] ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="progressbar"
    >
      <div
        className="h-full origin-left bg-[var(--color-primary)] shadow-[0_0_10px_color-mix(in_srgb,var(--color-primary)_65%,transparent)] transition-[width] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

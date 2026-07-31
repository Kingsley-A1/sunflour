"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import type { HomepageCarouselSlide } from "@/types/domain";

interface HomepageCarouselProps {
  slides: HomepageCarouselSlide[];
}

const ROTATION_MS = 2_000;
const SWIPE_THRESHOLD = 48;

export function HomepageCarousel({ slides }: HomepageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (
      slides.length < 2 ||
      interactionPaused ||
      userPaused ||
      reduceMotion
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [interactionPaused, reduceMotion, slides.length, userPaused]);

  if (slides.length === 0) {
    return null;
  }

  function show(index: number) {
    setActiveIndex((index + slides.length) % slides.length);
  }

  function finishSwipe(clientX: number) {
    if (pointerStartX.current === null) {
      return;
    }
    const delta = clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      didSwipe.current = true;
      show(activeIndex + (delta < 0 ? 1 : -1));
    }
  }

  return (
    <section
      aria-label="Featured Sunflour products"
      className="border-b border-[var(--color-border)] bg-[var(--color-canvas)]"
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={() => setInteractionPaused(false)}
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-0 sm:px-4 sm:py-4">
        <div
          className="relative aspect-[21/9] touch-pan-y overflow-hidden bg-[var(--color-surface-muted)] sm:rounded-[var(--radius-product)]"
          data-testid="homepage-carousel-frame"
          onPointerDown={(event) => {
            didSwipe.current = false;
            pointerStartX.current = event.clientX;
          }}
          onPointerCancel={() => {
            pointerStartX.current = null;
          }}
          onPointerUp={(event) => finishSwipe(event.clientX)}
        >
          <div
            className="flex h-full transition-transform duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-standard)]"
            data-testid="homepage-carousel-track"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <Link
                aria-label={`View ${slide.title}`}
                className="relative block h-full min-w-full"
                href={slide.href as Route}
                key={slide.id}
                onClick={(event) => {
                  if (didSwipe.current) {
                    event.preventDefault();
                    didSwipe.current = false;
                  }
                }}
              >
                <Image
                  alt={slide.altText}
                  className="object-cover"
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  src={slide.imageUrl}
                />
              </Link>
            ))}
          </div>

          {slides.length > 1 ? (
            <>
              <IconButton
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-[var(--color-surface-floating)]/92 shadow-[var(--shadow-floating)] sm:left-4"
                icon={<ChevronLeft className="h-5 w-5" aria-hidden="true" />}
                label="Show previous promotion"
                onClick={() => show(activeIndex - 1)}
              />
              <IconButton
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--color-surface-floating)]/92 shadow-[var(--shadow-floating)] sm:right-4"
                icon={<ChevronRight className="h-5 w-5" aria-hidden="true" />}
                label="Show next promotion"
                onClick={() => show(activeIndex + 1)}
              />
              {!reduceMotion ? (
                <IconButton
                  className="absolute right-2 top-2 bg-[var(--color-surface-floating)]/92 shadow-[var(--shadow-floating)] sm:right-4 sm:top-4"
                  icon={
                    userPaused ? (
                      <Play className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Pause className="h-4 w-4" aria-hidden="true" />
                    )
                  }
                  label={
                    userPaused
                      ? "Resume carousel rotation"
                      : "Pause carousel rotation"
                  }
                  onClick={() => setUserPaused((current) => !current)}
                />
              ) : null}
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-overlay-strong)] px-3 py-2 sm:bottom-4">
                {slides.map((slide, index) => (
                  <button
                    aria-label={`Show ${slide.title}`}
                    aria-pressed={activeIndex === index}
                    className={`h-2 rounded-full transition-all ${
                      activeIndex === index
                        ? "w-7 bg-[var(--color-accent)]"
                        : "w-2 bg-white/75"
                    }`}
                    key={slide.id}
                    onClick={() => show(index)}
                    type="button"
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

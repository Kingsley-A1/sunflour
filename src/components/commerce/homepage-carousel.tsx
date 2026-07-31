"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import type { HomepageCarouselSlide } from "@/types/domain";

interface HomepageCarouselProps {
  slides: HomepageCarouselSlide[];
}

const ROTATION_MS = 2_000;
const SWIPE_THRESHOLD = 48;

export function HomepageCarousel({ slides }: HomepageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);
  const pointerStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const maxStartIndex = Math.max(0, slides.length - visibleCount);
  const displayedIndex = Math.min(activeIndex, maxStartIndex);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const tablet = window.matchMedia("(min-width: 640px)");
    const sync = () => setVisibleCount(desktop.matches ? 3 : tablet.matches ? 2 : 1);

    sync();
    desktop.addEventListener("change", sync);
    tablet.addEventListener("change", sync);
    return () => {
      desktop.removeEventListener("change", sync);
      tablet.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (
      maxStartIndex === 0 ||
      interactionPaused ||
      reduceMotion
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((current) =>
        current >= maxStartIndex ? 0 : current + 1,
      );
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [interactionPaused, maxStartIndex, reduceMotion]);

  if (slides.length === 0) {
    return null;
  }

  function show(index: number) {
    if (index < 0) {
      setActiveIndex(maxStartIndex);
      return;
    }
    setActiveIndex(index > maxStartIndex ? 0 : index);
  }

  function finishSwipe(clientX: number) {
    if (pointerStartX.current === null) {
      return;
    }
    const delta = clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      didSwipe.current = true;
      show(displayedIndex + (delta < 0 ? 1 : -1));
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
      <div className="mx-auto max-w-7xl px-0 sm:px-4 sm:py-3">
        <div
          className="relative aspect-[21/9] touch-pan-y select-none overflow-hidden bg-[var(--color-surface-muted)] sm:aspect-[42/9] sm:rounded-[var(--radius-product)] lg:aspect-[63/9]"
          data-testid="homepage-carousel-frame"
          onPointerDown={(event) => {
            didSwipe.current = false;
            pointerStartX.current = event.clientX;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerCancel={(event) => {
            pointerStartX.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerUp={(event) => {
            finishSwipe(event.clientX);
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
        >
          <div
            className="flex h-full transition-transform duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-standard)]"
            data-testid="homepage-carousel-track"
            style={{
              transform: `translateX(-${displayedIndex * (100 / visibleCount)}%)`,
            }}
          >
            {slides.map((slide, index) => (
              <Link
                aria-label={`View ${slide.title}`}
                className="relative block h-full basis-full shrink-0 overflow-hidden border-r border-[var(--color-canvas)] last:border-r-0 sm:basis-1/2 lg:basis-1/3"
                href={slide.href as Route}
                key={slide.id}
                onDragStart={(event) => event.preventDefault()}
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
                  draggable={false}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  src={slide.imageUrl}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

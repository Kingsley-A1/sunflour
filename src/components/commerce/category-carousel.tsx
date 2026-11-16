"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

export interface CategoryTile {
  slug: string;
  name: string;
  productCount: number;
  imageUrl: string | null;
  imageAlt: string;
}

interface CategoryCarouselProps {
  tiles: CategoryTile[];
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * "What are you craving?" row: one tile per menu category, each opening the
 * menu filtered to that category. Native horizontal scrolling with snap points
 * keeps it fast and swipeable on phones; arrow buttons help mouse users.
 */
export function CategoryCarousel({ tiles }: CategoryCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    setCanScrollBack(track.scrollLeft > 4);
    setCanScrollForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    track.scrollBy({
      left: direction * track.clientWidth * 0.85,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  if (tiles.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="category-carousel-heading" className="py-10">
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4">
        <div>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Our menu</p>
          <h2
            className="m-0 mt-1 text-3xl font-extrabold sm:text-4xl"
            id="category-carousel-heading"
          >
            What are you craving?
          </h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <CarouselArrow
            direction="back"
            disabled={!canScrollBack}
            onClick={() => scrollByPage(-1)}
          />
          <CarouselArrow
            direction="forward"
            disabled={!canScrollForward}
            onClick={() => scrollByPage(1)}
          />
        </div>
      </div>

      <ul
        aria-label="Menu categories"
        className="m-0 mt-5 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:gap-4 xl:scroll-px-[max(1rem,calc((100vw-80rem)/2+1rem))] xl:px-[max(1rem,calc((100vw-80rem)/2+1rem))] [&::-webkit-scrollbar]:hidden"
        ref={trackRef}
      >
        {tiles.map((tile, index) => (
          <li
            className="w-[68vw] max-w-[17rem] shrink-0 snap-start sm:w-[15rem]"
            key={tile.slug}
          >
            <Link
              className="group grid overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-primary)] bg-[var(--color-surface)] shadow-[var(--shadow-raised)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-floating)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] motion-reduce:hover:translate-y-0"
              href={`/menu?category=${encodeURIComponent(tile.slug)}` as Route}
            >
              <span className="flex min-h-12 items-center justify-between gap-3 bg-[var(--color-primary)] px-4 text-[var(--color-on-primary)]">
                <span className="truncate text-base font-extrabold">{tile.name}</span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition duration-[var(--motion-duration-base)] group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                  aria-hidden="true"
                />
              </span>
              {/* Thin brand-yellow rule between the label and the photo. */}
              <span aria-hidden="true" className="block h-1 bg-[var(--color-accent)]" />
              <span className="relative block aspect-[4/3] overflow-hidden bg-[var(--color-surface-muted)]">
                {tile.imageUrl ? (
                  <SafeImage
                    alt={tile.imageAlt}
                    className="object-cover transition duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-standard)] group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                    fallback={<TileFallback name={tile.name} />}
                    fill
                    priority={index < 2}
                    sizes="(min-width: 640px) 15rem, 68vw"
                    src={tile.imageUrl}
                  />
                ) : (
                  <TileFallback name={tile.name} />
                )}
                <span className="absolute bottom-2 left-2 rounded-[var(--radius-pill)] bg-[var(--color-surface-floating)] px-2.5 py-1 text-xs font-bold text-[var(--color-text)] shadow-[var(--shadow-raised)]">
                  {tile.productCount} {tile.productCount === 1 ? "item" : "items"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex justify-center px-4">
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-7 text-base font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-raised)] transition hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          href={"/menu?view=products" as Route}
        >
          Order now
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "back" | "forward";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "back" ? ChevronLeft : ChevronRight;

  return (
    <button
      aria-label={direction === "back" ? "Previous categories" : "More categories"}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-raised)] transition hover:bg-[var(--color-surface-muted)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

function TileFallback({ name }: { name: string }) {
  return (
    <span className="relative grid h-full place-items-center px-4 text-center text-lg font-extrabold text-[var(--color-text-muted)]">
      {name}
    </span>
  );
}

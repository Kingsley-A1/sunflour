"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Gift,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import {
  getApiErrorMessage,
  updateAdminHomepageCarousel,
} from "@/lib/api/client";
import { uploadSingleAdminImage } from "@/lib/api/product-image-upload";
import type {
  HomepageCarouselSlide,
  HomepageMerchandisingSettings,
  UserRole,
} from "@/types/domain";

interface HomepageMerchandisingClientProps {
  initialSettings: HomepageMerchandisingSettings;
  role: UserRole;
}

export function HomepageMerchandisingClient({
  initialSettings,
  role,
}: HomepageMerchandisingClientProps) {
  const [slides, setSlides] = useState<HomepageCarouselSlide[]>(
    initialSettings.carousel.slides,
  );
  const [carouselMessage, setCarouselMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  function updateSlide(
    slideId: string,
    update: Partial<HomepageCarouselSlide>,
  ) {
    setSlides((current) =>
      current.map((slide) =>
        slide.id === slideId ? { ...slide, ...update } : slide,
      ),
    );
  }

  function moveSlide(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= slides.length) {
      return;
    }
    setSlides((current) => {
      const next = [...current];
      const source = next[index];
      const target = next[nextIndex];
      if (!source || !target) {
        return current;
      }
      next[index] = target;
      next[nextIndex] = source;
      return next;
    });
  }

  async function uploadSlideImage(slideId: string, file?: File) {
    if (!file) {
      return;
    }
    setBusyKey(`slide-${slideId}`);
    setError(null);
    try {
      const uploaded = await uploadSingleAdminImage(file, "CAROUSEL_BANNER");
      updateSlide(slideId, { imageUrl: uploaded.url });
    } catch (uploadError) {
      setError(
        getApiErrorMessage(uploadError, "Carousel banner upload failed."),
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function saveCarousel() {
    setBusyKey("carousel-save");
    setError(null);
    setCarouselMessage(null);
    try {
      const carousel = await updateAdminHomepageCarousel({
        slides: slides.map((slide, index) => ({
          ...slide,
          sortOrder: index,
        })),
      });
      setSlides(carousel.slides);
      setCarouselMessage("Homepage carousel saved.");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Carousel could not be saved."));
    } finally {
      setBusyKey(null);
    }
  }

  function addSlide() {
    const id = `slide-${Date.now()}`;
    setSlides((current) => [
      ...current,
      {
        id,
        title: "New promotion",
        imageUrl: "",
        altText: "Sunflour Bakery promotion",
        href: "/menu",
        isActive: false,
        sortOrder: current.length,
      },
    ]);
  }

  return (
    <div className="grid gap-6">
      {error ? (
        <p
          className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Homepage
            </p>
            <h2 className="m-0 mt-1 text-xl font-extrabold">
              Promotion carousel
            </h2>
            <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              Slides rotate every two seconds. Use a 21:9 banner and a relative
              link such as /menu?category=cakes or /products/product-slug.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={addSlide}
              variant="secondary"
            >
              Add slide
            </Button>
            <Button
              icon={<Save className="h-4 w-4" aria-hidden="true" />}
              loading={busyKey === "carousel-save"}
              onClick={saveCarousel}
            >
              Save carousel
            </Button>
          </div>
        </div>
        {carouselMessage ? (
          <p className="m-0 text-sm font-semibold text-[var(--color-success)]" role="status">
            {carouselMessage}
          </p>
        ) : null}
        <div className="grid gap-4">
          {slides.map((slide, index) => (
            <article
              className="grid gap-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 lg:grid-cols-[16rem_minmax(0,1fr)_auto]"
              key={slide.id}
            >
              <div className="grid content-start gap-2">
                <div className="relative aspect-[21/9] overflow-hidden rounded-[var(--radius-product)] bg-[var(--color-surface)]">
                  {slide.imageUrl ? (
                    <SafeImage
                      alt={slide.altText}
                      className="object-cover"
                      fallback={
                        <div className="grid h-full place-items-center px-3 text-center text-xs font-semibold text-[var(--color-text-muted)]">
                          Banner preview unavailable
                        </div>
                      }
                      fill
                      sizes="256px"
                      src={slide.imageUrl}
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs font-semibold text-[var(--color-text-muted)]">
                      Upload a 21:9 banner
                    </div>
                  )}
                </div>
                <Input
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  label="Replace banner"
                  onChange={(event) =>
                    void uploadSlideImage(slide.id, event.target.files?.[0])
                  }
                  type="file"
                />
                {busyKey === `slide-${slide.id}` ? (
                  <p className="m-0 text-xs font-semibold text-[var(--color-primary)]">
                    Uploading banner…
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Slide title"
                  onChange={(event) =>
                    updateSlide(slide.id, { title: event.target.value })
                  }
                  value={slide.title}
                />
                <Input
                  label="Destination link"
                  onChange={(event) =>
                    updateSlide(slide.id, { href: event.target.value })
                  }
                  value={slide.href}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Image description"
                    onChange={(event) =>
                      updateSlide(slide.id, { altText: event.target.value })
                    }
                    value={slide.altText}
                  />
                </div>
                <Checkbox
                  checked={slide.isActive}
                  label="Show this slide"
                  onChange={(event) =>
                    updateSlide(slide.id, { isActive: event.target.checked })
                  }
                />
              </div>
              <div className="flex items-start gap-1 lg:flex-col">
                <IconButton
                  disabled={index === 0}
                  icon={<ArrowUp className="h-4 w-4" aria-hidden="true" />}
                  label={`Move ${slide.title} earlier`}
                  onClick={() => moveSlide(index, -1)}
                />
                <IconButton
                  disabled={index === slides.length - 1}
                  icon={<ArrowDown className="h-4 w-4" aria-hidden="true" />}
                  label={`Move ${slide.title} later`}
                  onClick={() => moveSlide(index, 1)}
                />
                <IconButton
                  icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                  label={`Remove ${slide.title}`}
                  onClick={() =>
                    setSlides((current) =>
                      current.filter((item) => item.id !== slide.id),
                    )
                  }
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {role === "SUPER_ADMIN" ? <WeeklyOffersPointer /> : null}
    </div>
  );
}

/**
 * Weekly offers used to live at the bottom of this page, which made them
 * hard to find. They now have their own page; this card keeps the old path
 * working for admins who still look here.
 */
function WeeklyOffersPointer() {
  return (
    <Link
      className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:bg-[var(--color-surface-muted)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
      href={"/admin/weekly-offers" as Route}
    >
      <span className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-bold">Weekly offers moved</span>
          <span className="block text-sm text-[var(--color-text-muted)]">
            Create and schedule &quot;buy this, get that free&quot; offers on
            their own page.
          </span>
        </span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
    </Link>
  );
}

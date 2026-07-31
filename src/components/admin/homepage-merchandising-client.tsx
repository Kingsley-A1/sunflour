"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { Select } from "@/components/ui/select";
import {
  getApiErrorMessage,
  updateAdminHomepageCarousel,
  updateAdminWeeklySale,
} from "@/lib/api/client";
import { uploadSingleAdminImage } from "@/lib/api/product-image-upload";
import type {
  AdminProduct,
  HomepageCarouselSlide,
  HomepageMerchandisingSettings,
  UserRole,
  WeeklySaleSettings,
} from "@/types/domain";

interface HomepageMerchandisingClientProps {
  initialSettings: HomepageMerchandisingSettings;
  products: AdminProduct[];
  role: UserRole;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function defaultWeeklySale(): WeeklySaleSettings {
  const weekStart = toDateKey(new Date());
  return {
    productId: "",
    discountPercent: 10,
    weekStart,
    weekEnd: addDays(weekStart, 6),
    bannerImageUrl: "",
    cardImageUrl: "",
    isActive: false,
  };
}

export function HomepageMerchandisingClient({
  initialSettings,
  products,
  role,
}: HomepageMerchandisingClientProps) {
  const [slides, setSlides] = useState<HomepageCarouselSlide[]>(
    initialSettings.carousel.slides,
  );
  const [weeklySale, setWeeklySale] = useState<WeeklySaleSettings>(() => {
    const current = initialSettings.weeklySale;
    return current
      ? {
          productId: current.productId,
          discountPercent: current.discountPercent,
          weekStart: current.weekStart,
          weekEnd: current.weekEnd,
          bannerImageUrl: current.bannerImageUrl,
          cardImageUrl: current.cardImageUrl,
          isActive: current.isActive,
        }
      : defaultWeeklySale();
  });
  const [carouselMessage, setCarouselMessage] = useState<string | null>(null);
  const [saleMessage, setSaleMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const canManageSale = role === "SUPER_ADMIN";
  const activeProducts = useMemo(
    () =>
      products
        .filter(
          (product) =>
            product.status === "ACTIVE" && product.category.isActive,
        )
        .sort((first, second) => first.name.localeCompare(second.name)),
    [products],
  );

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

  async function uploadSaleImage(
    field: "bannerImageUrl" | "cardImageUrl",
    file?: File,
  ) {
    if (!file) {
      return;
    }
    setBusyKey(field);
    setError(null);
    try {
      const uploaded = await uploadSingleAdminImage(
        file,
        field === "bannerImageUrl"
          ? "CAROUSEL_BANNER"
          : "SALE_CARD_IMAGE",
      );
      setWeeklySale((current) => ({ ...current, [field]: uploaded.url }));
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Sale image upload failed."));
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

  async function saveWeeklySale() {
    setBusyKey("sale-save");
    setError(null);
    setSaleMessage(null);
    try {
      const saved = await updateAdminWeeklySale(weeklySale);
      setWeeklySale({
        productId: saved.productId,
        discountPercent: saved.discountPercent,
        weekStart: saved.weekStart,
        weekEnd: saved.weekEnd,
        bannerImageUrl: saved.bannerImageUrl,
        cardImageUrl: saved.cardImageUrl,
        isActive: saved.isActive,
      });
      setSaleMessage("Weekly sale saved.");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Weekly sale could not be saved."));
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

      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <p className="m-0 flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Weekly merchandising
          </p>
          <h2 className="m-0 mt-1 text-xl font-extrabold">One weekly sale</h2>
          <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            The active product receives the selected discount at checkout, its
            sale card image replaces the normal card image, and the sale banner
            appears first in the carousel.
          </p>
        </div>
        {!canManageSale ? (
          <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-warning-soft)] p-3 text-sm font-semibold text-[var(--color-text)]">
            Weekly sale pricing is restricted to super admins.
          </p>
        ) : (
          <>
            {saleMessage ? (
              <p className="m-0 text-sm font-semibold text-[var(--color-success)]" role="status">
                {saleMessage}
              </p>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid content-start gap-4">
                <Select
                  label="Sale product"
                  onChange={(event) =>
                    setWeeklySale((current) => ({
                      ...current,
                      productId: event.target.value,
                    }))
                  }
                  value={weeklySale.productId}
                >
                  <option value="">Choose product</option>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
                <Input
                  inputMode="numeric"
                  label="Discount percent"
                  max="90"
                  min="1"
                  onChange={(event) =>
                    setWeeklySale((current) => ({
                      ...current,
                      discountPercent: Number(event.target.value),
                    }))
                  }
                  type="number"
                  value={String(weeklySale.discountPercent)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Week starts"
                    onChange={(event) => {
                      const weekStart = event.target.value;
                      setWeeklySale((current) => ({
                        ...current,
                        weekStart,
                        weekEnd: addDays(weekStart, 6),
                      }));
                    }}
                    type="date"
                    value={weeklySale.weekStart}
                  />
                  <Input
                    helpText="Automatically set to seven calendar days."
                    label="Week ends"
                    readOnly
                    type="date"
                    value={weeklySale.weekEnd}
                  />
                </div>
                <Checkbox
                  checked={weeklySale.isActive}
                  label="Activate this weekly sale"
                  onChange={(event) =>
                    setWeeklySale((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SaleImageField
                  alt="Weekly sale carousel banner"
                  aspect="21/9"
                  busy={busyKey === "bannerImageUrl"}
                  help="Use a 21:9 promotional banner."
                  label="Sale carousel banner"
                  onFile={(file) =>
                    void uploadSaleImage("bannerImageUrl", file)
                  }
                  url={weeklySale.bannerImageUrl}
                />
                <SaleImageField
                  alt="Weekly sale product card"
                  aspect="4/3"
                  busy={busyKey === "cardImageUrl"}
                  help="Use a clean 4:3 product photo."
                  label="Sale product card image"
                  onFile={(file) =>
                    void uploadSaleImage("cardImageUrl", file)
                  }
                  url={weeklySale.cardImageUrl}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                icon={<Save className="h-4 w-4" aria-hidden="true" />}
                loading={busyKey === "sale-save"}
                onClick={saveWeeklySale}
              >
                Save weekly sale
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SaleImageField({
  alt,
  aspect,
  busy,
  help,
  label,
  onFile,
  url,
}: {
  alt: string;
  aspect: "21/9" | "4/3";
  busy: boolean;
  help: string;
  label: string;
  onFile: (file?: File) => void;
  url: string;
}) {
  return (
    <div className="grid content-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
      <div
        className={`relative overflow-hidden rounded-[var(--radius-product)] bg-[var(--color-surface-muted)] ${
          aspect === "21/9" ? "aspect-[21/9]" : "aspect-[4/3]"
        }`}
      >
        {url ? (
          <SafeImage
            alt={alt}
            className="object-cover"
            fallback={
              <div className="grid h-full place-items-center px-3 text-center text-xs font-semibold text-[var(--color-text-muted)]">
                Image preview unavailable
              </div>
            }
            fill
            sizes="300px"
            src={url}
          />
        ) : (
          <div className="grid h-full place-items-center px-3 text-center text-xs font-semibold text-[var(--color-text-muted)]">
            No image uploaded
          </div>
        )}
      </div>
      <Input
        accept="image/jpeg,image/png,image/webp,image/avif"
        helpText={help}
        label={label}
        onChange={(event) => onFile(event.target.files?.[0])}
        type="file"
      />
      {busy ? (
        <p className="m-0 flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
          <Upload className="h-4 w-4" aria-hidden="true" />
          Uploading…
        </p>
      ) : null}
    </div>
  );
}

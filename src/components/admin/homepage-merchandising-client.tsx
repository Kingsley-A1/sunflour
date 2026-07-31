"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
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
  updateAdminWeeklyOffers,
} from "@/lib/api/client";
import { uploadSingleAdminImage } from "@/lib/api/product-image-upload";
import type {
  AdminProduct,
  HomepageCarouselSlide,
  HomepageMerchandisingSettings,
  UserRole,
  WeeklyOffer,
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

function newOfferDraft(): WeeklyOffer {
  const weekStart = toDateKey(new Date());
  return {
    id: `offer-${Date.now()}`,
    purchaseProductId: "",
    freeItemLabel: "",
    headline: "",
    description: "",
    weekStart,
    weekEnd: addDays(weekStart, 6),
    bannerImageUrl: "",
    cardImageUrl: "",
    isActive: false,
  };
}

function formatOfferRange(offer: WeeklyOffer): string {
  return `${offer.weekStart} to ${offer.weekEnd}`;
}

export function HomepageMerchandisingClient({
  initialSettings,
  products,
  role,
}: HomepageMerchandisingClientProps) {
  const [slides, setSlides] = useState<HomepageCarouselSlide[]>(
    initialSettings.carousel.slides,
  );
  const [offers, setOffers] = useState<WeeklyOffer[]>(
    initialSettings.weeklyOffers,
  );
  // `draft` is the offer currently open in the form. Null means the form is
  // closed, which is the state right after a successful save.
  const [draft, setDraft] = useState<WeeklyOffer | null>(null);
  const [carouselMessage, setCarouselMessage] = useState<string | null>(null);
  const [offerMessage, setOfferMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const canManageOffers = role === "SUPER_ADMIN";
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

  async function uploadOfferImage(
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
        field === "bannerImageUrl" ? "CAROUSEL_BANNER" : "SALE_CARD_IMAGE",
      );
      setDraft((current) =>
        current ? { ...current, [field]: uploaded.url } : current,
      );
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Offer image upload failed."));
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

  async function persistOffers(next: WeeklyOffer[], successMessage: string) {
    setBusyKey("offer-save");
    setError(null);
    setOfferMessage(null);
    try {
      const saved = await updateAdminWeeklyOffers(next);
      setOffers(saved);
      // Close the form on success so the saved offer reads as committed; it
      // stays editable from the list below.
      setDraft(null);
      setOfferMessage(successMessage);
      return true;
    } catch (saveError) {
      setError(
        getApiErrorMessage(saveError, "Weekly offers could not be saved."),
      );
      return false;
    } finally {
      setBusyKey(null);
    }
  }

  async function saveDraft() {
    if (!draft) {
      return;
    }

    const exists = offers.some((offer) => offer.id === draft.id);
    const next = exists
      ? offers.map((offer) => (offer.id === draft.id ? draft : offer))
      : [...offers, draft];

    await persistOffers(
      next,
      exists ? "Weekly offer updated." : "Weekly offer created.",
    );
  }

  async function deleteOffer(offerId: string) {
    await persistOffers(
      offers.filter((offer) => offer.id !== offerId),
      "Weekly offer removed.",
    );
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
          <h2 className="m-0 mt-1 text-xl font-extrabold">Weekly offers</h2>
          <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            A weekly offer is a &quot;buy this, get that free&quot; deal (for
            example, a Lebanese Burger with a free Coke). Offers never change
            product prices &mdash; staff honour the free item when the order is
            fulfilled. Schedule future offers here; active offers may not
            overlap.
          </p>
        </div>
        {!canManageOffers ? (
          <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-warning-soft)] p-3 text-sm font-semibold text-[var(--color-text)]">
            Weekly offers are restricted to super admins.
          </p>
        ) : (
          <>
            {offerMessage ? (
              <p
                className="m-0 text-sm font-semibold text-[var(--color-success)]"
                role="status"
              >
                {offerMessage}
              </p>
            ) : null}

            {offers.length === 0 ? (
              <p className="m-0 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-strong)] p-4 text-sm text-[var(--color-text-muted)]">
                No weekly offers yet. Create the first one below.
              </p>
            ) : (
              <ul className="m-0 grid list-none gap-2 p-0">
                {offers.map((offer) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3"
                    key={offer.id}
                  >
                    <div className="min-w-0">
                      <p className="m-0 font-bold">
                        {offer.headline || "Untitled offer"}
                      </p>
                      <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
                        {offer.freeItemLabel
                          ? `Free: ${offer.freeItemLabel} · `
                          : ""}
                        {formatOfferRange(offer)} ·{" "}
                        {offer.isActive ? "Active" : "Draft"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => {
                          setOfferMessage(null);
                          setDraft({ ...offer });
                        }}
                        variant="secondary"
                      >
                        Edit
                      </Button>
                      <IconButton
                        icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                        label={`Delete ${offer.headline || "offer"}`}
                        onClick={() => void deleteOffer(offer.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {draft ? (
              <div className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="m-0 text-lg font-bold">
                    {offers.some((offer) => offer.id === draft.id)
                      ? "Edit weekly offer"
                      : "New weekly offer"}
                  </h3>
                  <IconButton
                    icon={<X className="h-4 w-4" aria-hidden="true" />}
                    label="Close offer form"
                    onClick={() => setDraft(null)}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid content-start gap-4">
                    <Input
                      helpText="Shown on the homepage and the Weekly Offer page."
                      label="Headline"
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, headline: event.target.value }
                            : current,
                        )
                      }
                      placeholder="Lebanese Burger + Free Coke"
                      value={draft.headline}
                    />
                    <Select
                      label="Buy this product"
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                purchaseProductId: event.target.value,
                              }
                            : current,
                        )
                      }
                      value={draft.purchaseProductId}
                    >
                      <option value="">Choose product</option>
                      {activeProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </Select>
                    <Input
                      helpText="What the customer gets free with that purchase."
                      label="Get this free"
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, freeItemLabel: event.target.value }
                            : current,
                        )
                      }
                      placeholder="Free Coke"
                      value={draft.freeItemLabel}
                    />
                    <Input
                      helpText="Optional extra detail for the offer page."
                      label="Description (optional)"
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, description: event.target.value }
                            : current,
                        )
                      }
                      value={draft.description ?? ""}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Offer starts"
                        onChange={(event) => {
                          const weekStart = event.target.value;
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  weekStart,
                                  weekEnd: addDays(weekStart, 6),
                                }
                              : current,
                          );
                        }}
                        type="date"
                        value={draft.weekStart}
                      />
                      <Input
                        helpText="Adjust if the offer runs longer than a week."
                        label="Offer ends"
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? { ...current, weekEnd: event.target.value }
                              : current,
                          )
                        }
                        type="date"
                        value={draft.weekEnd}
                      />
                    </div>
                    <Checkbox
                      checked={draft.isActive}
                      label="Activate this offer (must not overlap another active offer)"
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, isActive: event.target.checked }
                            : current,
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SaleImageField
                      alt="Weekly offer carousel banner"
                      aspect="21/9"
                      busy={busyKey === "bannerImageUrl"}
                      help="Use a 21:9 promotional banner."
                      label="Offer carousel banner"
                      onFile={(file) =>
                        void uploadOfferImage("bannerImageUrl", file)
                      }
                      url={draft.bannerImageUrl}
                    />
                    <SaleImageField
                      alt="Weekly offer card"
                      aspect="4/3"
                      busy={busyKey === "cardImageUrl"}
                      help="Use a clean 4:3 photo of the deal."
                      label="Offer card image"
                      onFile={(file) =>
                        void uploadOfferImage("cardImageUrl", file)
                      }
                      url={draft.cardImageUrl}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button onClick={() => setDraft(null)} variant="secondary">
                    Cancel
                  </Button>
                  <Button
                    icon={<Save className="h-4 w-4" aria-hidden="true" />}
                    loading={busyKey === "offer-save"}
                    onClick={saveDraft}
                  >
                    Save offer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button
                  icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => {
                    setOfferMessage(null);
                    setDraft(newOfferDraft());
                  }}
                >
                  New weekly offer
                </Button>
              </div>
            )}
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

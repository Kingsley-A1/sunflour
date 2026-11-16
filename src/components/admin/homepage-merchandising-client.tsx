"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Gift,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  getApiErrorMessage,
  updateAdminHomepageCarousel,
} from "@/lib/api/client";
import { uploadSingleAdminImage } from "@/lib/api/product-image-upload";
import { cn } from "@/lib/utils";
import type {
  AdminProduct,
  HomepageCarouselSlide,
  HomepageMerchandisingSettings,
  UserRole,
} from "@/types/domain";

/**
 * Homepage carousel manager.
 *
 * Fast path (the 30-second job): "Add product slide" → search → tap a
 * product. If that product has ever had a banner, the slide goes live
 * immediately; otherwise the admin uploads one banner, once, and it is
 * remembered for next time. Quick actions (add, show/hide, reorder, delete)
 * save instantly; only the text editor has its own Save button.
 */

interface HomepageMerchandisingClientProps {
  initialSettings: HomepageMerchandisingSettings;
  products: AdminProduct[];
  role: UserRole;
}

type ProductBannerState = "ready" | "needs-banner" | "in-carousel";

interface PickerProduct {
  product: AdminProduct;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  state: ProductBannerState;
}

const BANNER_HINT =
  "Wide 21:9 banner, e.g. 2100 × 900 px. JPG, PNG or WebP.";

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function productThumbnail(product: AdminProduct): string | null {
  const image =
    product.images.find((item) => item.isPrimary) ?? product.images[0];
  return image?.mediaAsset.publicUrl ?? null;
}

/** Older slides predate product links; match them to a product by name. */
function slideMatchesProduct(slide: HomepageCarouselSlide, product: AdminProduct) {
  return slide.productId
    ? slide.productId === product.id
    : normalize(slide.title) === normalize(product.name);
}

function slideForProduct(
  product: AdminProduct,
  imageUrl: string,
): HomepageCarouselSlide {
  return {
    id: `product-${product.id}-${Date.now()}`,
    title: product.name,
    imageUrl,
    altText: `${product.name} from Sunflour Bakery`,
    href: `/products/${product.slug}`,
    isActive: true,
    sortOrder: 0,
    productId: product.id,
  };
}

export function HomepageMerchandisingClient({
  initialSettings,
  products,
  role,
}: HomepageMerchandisingClientProps) {
  const { notify } = useToast();
  const [slides, setSlides] = useState<HomepageCarouselSlide[]>(
    initialSettings.carousel.slides,
  );
  const [library, setLibrary] = useState<Record<string, string>>(
    initialSettings.carousel.bannerLibrary ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingProduct, setPendingProduct] = useState<AdminProduct | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<HomepageCarouselSlide | null>(null);
  const [editingIsNew, setEditingIsNew] = useState(false);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const sellableProducts = useMemo(
    () =>
      products.filter(
        (product) => product.status === "ACTIVE" && product.category.isActive,
      ),
    [products],
  );

  const pickerProducts = useMemo<PickerProduct[]>(() => {
    const term = normalize(query);
    return sellableProducts
      .filter(
        (product) =>
          !term ||
          normalize(product.name).includes(term) ||
          normalize(product.category.name).includes(term),
      )
      .map((product) => {
        const existing = slides.find((slide) => slideMatchesProduct(slide, product));
        const bannerUrl = library[product.id] ?? existing?.imageUrl ?? null;
        const state: ProductBannerState = existing
          ? "in-carousel"
          : bannerUrl
            ? "ready"
            : "needs-banner";
        return { product, thumbnailUrl: productThumbnail(product), bannerUrl, state };
      })
      .sort((a, b) => {
        const rank = { ready: 0, "needs-banner": 1, "in-carousel": 2 };
        return rank[a.state] - rank[b.state] || a.product.name.localeCompare(b.product.name);
      });
  }, [library, query, sellableProducts, slides]);

  // Older slides whose title matches a product exactly: one tap links them
  // so they follow the product (hidden while sold out, link kept current).
  const linkableSlides = useMemo(
    () =>
      slides.flatMap((slide) => {
        if (slide.productId) return [];
        const product = sellableProducts.find((item) => slideMatchesProduct(slide, item));
        return product ? [{ slideId: slide.id, product }] : [];
      }),
    [sellableProducts, slides],
  );

  const visibleCount = slides.filter((slide) => slide.isActive).length;

  async function commit(next: HomepageCarouselSlide[], successMessage: string) {
    const previous = slides;
    setSlides(next);
    setSaving(true);
    setError(null);
    try {
      const saved = await updateAdminHomepageCarousel({
        slides: next.map((slide, index) => ({ ...slide, sortOrder: index })),
      });
      setSlides(saved.slides);
      if (saved.bannerLibrary) {
        setLibrary(saved.bannerLibrary);
      }
      notify(successMessage, "success");
      return true;
    } catch (saveError) {
      setSlides(previous);
      setError(getApiErrorMessage(saveError, "The carousel could not be saved."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  function closePicker() {
    setPickerOpen(false);
    setQuery("");
    setPendingProduct(null);
  }

  async function pickProduct(item: PickerProduct) {
    if (item.state === "in-carousel" || saving) {
      return;
    }
    if (!item.bannerUrl) {
      setPendingProduct(item.product);
      return;
    }
    // Newest promotion goes first: that's usually why it was added.
    const ok = await commit(
      [slideForProduct(item.product, item.bannerUrl), ...slides],
      `${item.product.name} is now on the homepage.`,
    );
    if (ok) {
      closePicker();
    }
  }

  async function uploadPendingBanner(files: File[]) {
    const file = files[0];
    if (!file || !pendingProduct) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadSingleAdminImage(file, "CAROUSEL_BANNER");
      const ok = await commit(
        [slideForProduct(pendingProduct, uploaded.url), ...slides],
        `${pendingProduct.name} is now on the homepage. Its banner is saved for next time.`,
      );
      if (ok) {
        closePicker();
      }
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Banner upload failed."));
    } finally {
      setUploading(false);
    }
  }

  function toggleSlide(slide: HomepageCarouselSlide) {
    void commit(
      slides.map((item) =>
        item.id === slide.id ? { ...item, isActive: !item.isActive } : item,
      ),
      slide.isActive ? `${slide.title} hidden.` : `${slide.title} is showing.`,
    );
  }

  function moveSlide(index: number, direction: -1 | 1) {
    const target = index + direction;
    const source = slides[index];
    const other = slides[target];
    if (!source || !other) {
      return;
    }
    const next = [...slides];
    next[index] = other;
    next[target] = source;
    void commit(next, "Order saved.");
  }

  function removeSlide(slide: HomepageCarouselSlide) {
    const note = slide.productId
      ? " Its banner stays saved, so you can add it back in one tap."
      : "";
    if (!window.confirm(`Remove ${slide.title} from the homepage?${note}`)) {
      return;
    }
    void commit(
      slides.filter((item) => item.id !== slide.id),
      `${slide.title} removed.`,
    );
  }

  function linkMatchingSlides() {
    const links = new Map(linkableSlides.map((item) => [item.slideId, item.product]));
    void commit(
      slides.map((slide) => {
        const product = links.get(slide.id);
        return product
          ? { ...slide, productId: product.id, href: `/products/${product.slug}` }
          : slide;
      }),
      `${links.size} ${links.size === 1 ? "slide" : "slides"} linked to products.`,
    );
  }

  function startCustomSlide() {
    closePicker();
    setEditingIsNew(true);
    setEditing({
      id: `slide-${Date.now()}`,
      title: "",
      imageUrl: "",
      altText: "",
      href: "/menu",
      isActive: true,
      sortOrder: 0,
    });
  }

  async function saveEditing() {
    if (!editing) {
      return;
    }
    if (!editing.title.trim() || !editing.imageUrl) {
      setError("Add a title and a banner before saving the slide.");
      return;
    }
    const draft = {
      ...editing,
      altText: editing.altText.trim() || `${editing.title.trim()} from Sunflour Bakery`,
    };
    const next = editingIsNew
      ? [draft, ...slides]
      : slides.map((slide) => (slide.id === draft.id ? draft : slide));
    const ok = await commit(next, editingIsNew ? "Slide added." : "Slide updated.");
    if (ok) {
      setEditing(null);
      setEditingIsNew(false);
    }
  }

  async function uploadEditingBanner(files: File[]) {
    const file = files[0];
    if (!file) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadSingleAdminImage(file, "CAROUSEL_BANNER");
      setEditing((current) => (current ? { ...current, imageUrl: uploaded.url } : current));
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Banner upload failed."));
    } finally {
      setUploading(false);
    }
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
            <h2 className="m-0 text-xl font-extrabold">Promotion carousel</h2>
            <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              {visibleCount} of {slides.length} slides showing. Changes save
              instantly. Product slides hide themselves while the product is
              sold out or hidden.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={saving}
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                setEditing(null);
                setPickerOpen(true);
              }}
            >
              Add product slide
            </Button>
            <Button disabled={saving} onClick={startCustomSlide} variant="secondary">
              Custom slide
            </Button>
          </div>
        </div>

        {pickerOpen ? (
          <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-3 shadow-[var(--shadow-raised)]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="m-0 text-base font-bold">
                {pendingProduct ? `Banner for ${pendingProduct.name}` : "Choose a product to promote"}
              </h3>
              <IconButton
                icon={<X className="h-4 w-4" aria-hidden="true" />}
                label="Close product picker"
                onClick={closePicker}
              />
            </div>

            {pendingProduct ? (
              <div className="grid gap-3">
                <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
                  {pendingProduct.name} has never had a homepage banner. Upload
                  one now; it&apos;s saved, so you&apos;ll never need to upload
                  it again. The slide goes live as soon as the upload finishes.
                </p>
                <ImageDropzone
                  disabled={uploading || saving}
                  hint={BANNER_HINT}
                  label={uploading ? "Uploading banner…" : "Upload wide banner"}
                  onFiles={(files) => void uploadPendingBanner(files)}
                />
                <div>
                  <Button onClick={() => setPendingProduct(null)} variant="secondary">
                    Back to products
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <label className="relative block">
                  <span className="sr-only">Search products</span>
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-soft)]"
                  />
                  <input
                    autoFocus
                    className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-base focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by product or category"
                    type="search"
                    value={query}
                  />
                </label>
                {pickerProducts.length === 0 ? (
                  <p className="m-0 p-3 text-sm text-[var(--color-text-muted)]">
                    No active products match “{query}”.
                  </p>
                ) : (
                  <ul className="m-0 grid max-h-[22rem] list-none gap-1 overflow-y-auto p-0">
                    {pickerProducts.map((item) => (
                      <li key={item.product.id}>
                        <button
                          aria-disabled={item.state === "in-carousel"}
                          className={cn(
                            "flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-sm)] p-2 text-left transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
                            item.state === "in-carousel"
                              ? "cursor-default opacity-60"
                              : "hover:bg-[var(--color-surface-muted)]",
                          )}
                          disabled={saving}
                          onClick={() => void pickProduct(item)}
                          type="button"
                        >
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]">
                            {item.thumbnailUrl ? (
                              <SafeImage
                                alt=""
                                className="object-cover"
                                fallback={null}
                                fill
                                sizes="44px"
                                src={item.thumbnailUrl}
                              />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{item.product.name}</span>
                            <span className="block truncate text-xs text-[var(--color-text-muted)]">
                              {item.product.category.name}
                            </span>
                          </span>
                          <ProductStateChip state={item.state} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        ) : null}

        {linkableSlides.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--color-info)] bg-[var(--color-info-soft)] p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-sm leading-6">
              <span className="font-bold">
                {linkableSlides.length} older {linkableSlides.length === 1 ? "slide matches a product" : "slides match products"}.
              </span>{" "}
              Link them so they open the product page and hide while sold out.
            </p>
            <Button
              disabled={saving}
              icon={<Link2 className="h-4 w-4" aria-hidden="true" />}
              onClick={linkMatchingSlides}
              variant="secondary"
            >
              Link to products
            </Button>
          </div>
        ) : null}

        {editing ? (
          <SlideEditor
            isNew={editingIsNew}
            onCancel={() => {
              setEditing(null);
              setEditingIsNew(false);
            }}
            onChange={setEditing}
            onSave={() => void saveEditing()}
            onUpload={(files) => void uploadEditingBanner(files)}
            products={sellableProducts}
            productsById={productsById}
            saving={saving}
            slide={editing}
            uploading={uploading}
          />
        ) : null}

        {slides.length === 0 ? (
          <p className="m-0 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-strong)] p-4 text-sm text-[var(--color-text-muted)]">
            No slides yet. Tap “Add product slide” to promote something.
          </p>
        ) : (
          <ol className="m-0 grid list-none gap-2 p-0">
            {slides.map((slide, index) => {
              const product = slide.productId ? productsById.get(slide.productId) : undefined;
              const productUnavailable =
                Boolean(slide.productId) &&
                (!product || product.status !== "ACTIVE" || !product.category.isActive);
              return (
                <li
                  className={cn(
                    "grid gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center",
                    !slide.isActive && "opacity-70",
                  )}
                  key={slide.id}
                >
                  <div className="relative aspect-[21/9] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]">
                    <SafeImage
                      alt={slide.altText}
                      className="object-cover"
                      fallback={
                        <div className="grid h-full place-items-center text-xs text-[var(--color-text-muted)]">
                          No banner
                        </div>
                      }
                      fill
                      sizes="(min-width: 640px) 160px, 100vw"
                      src={slide.imageUrl}
                    />
                  </div>
                  <div className="min-w-0 px-1 sm:px-0">
                    <p className="m-0 flex flex-wrap items-center gap-2 font-bold">
                      <span className="text-[var(--color-text-soft)]">{index + 1}.</span>
                      <span className="min-w-0 truncate">{slide.title}</span>
                    </p>
                    <p className="m-0 mt-1 flex flex-wrap gap-x-2 text-xs text-[var(--color-text-muted)]">
                      <span>{slide.productId ? "Product slide" : `Custom link: ${slide.href}`}</span>
                      {productUnavailable ? (
                        <span className="font-semibold text-[var(--color-warning-text)]">
                          · Hidden on site: product not available
                        </span>
                      ) : null}
                    </p>
                    <div className="-ml-1 mt-1">
                      <Checkbox
                        checked={slide.isActive}
                        disabled={saving}
                        label="Show on homepage"
                        onChange={() => toggleSlide(slide)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 px-1 pb-1 sm:p-0">
                    <IconButton
                      disabled={saving || index === 0}
                      icon={<ArrowUp className="h-4 w-4" aria-hidden="true" />}
                      label={`Move ${slide.title} earlier`}
                      onClick={() => moveSlide(index, -1)}
                    />
                    <IconButton
                      disabled={saving || index === slides.length - 1}
                      icon={<ArrowDown className="h-4 w-4" aria-hidden="true" />}
                      label={`Move ${slide.title} later`}
                      onClick={() => moveSlide(index, 1)}
                    />
                    <IconButton
                      disabled={saving}
                      icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                      label={`Edit ${slide.title}`}
                      onClick={() => {
                        closePicker();
                        setEditingIsNew(false);
                        setEditing({ ...slide });
                      }}
                    />
                    <IconButton
                      disabled={saving}
                      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      label={`Remove ${slide.title}`}
                      onClick={() => removeSlide(slide)}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {role === "SUPER_ADMIN" ? <WeeklyOffersPointer /> : null}
    </div>
  );
}

function ProductStateChip({ state }: { state: ProductBannerState }) {
  if (state === "in-carousel") {
    return (
      <span className="shrink-0 text-xs font-semibold text-[var(--color-text-muted)]">
        In carousel
      </span>
    );
  }
  if (state === "ready") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-success)] px-2 py-0.5 text-xs font-bold text-[var(--color-success-text)]">
        <Check className="h-3 w-3" aria-hidden="true" />
        One tap
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-warning)] px-2 py-0.5 text-xs font-bold text-[var(--color-warning-text)]">
      Needs banner
    </span>
  );
}

function SlideEditor({
  isNew,
  onCancel,
  onChange,
  onSave,
  onUpload,
  products,
  productsById,
  saving,
  slide,
  uploading,
}: {
  isNew: boolean;
  onCancel: () => void;
  onChange: (slide: HomepageCarouselSlide) => void;
  onSave: () => void;
  onUpload: (files: File[]) => void;
  products: AdminProduct[];
  productsById: Map<string, AdminProduct>;
  saving: boolean;
  slide: HomepageCarouselSlide;
  uploading: boolean;
}) {
  const linkedProduct = slide.productId ? productsById.get(slide.productId) : undefined;

  return (
    <div className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-3 shadow-[var(--shadow-raised)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 text-base font-bold">{isNew ? "New custom slide" : `Edit ${slide.title}`}</h3>
        <IconButton
          icon={<X className="h-4 w-4" aria-hidden="true" />}
          label="Close slide editor"
          onClick={onCancel}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="grid content-start gap-2">
          <div className="relative aspect-[21/9] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]">
            {slide.imageUrl ? (
              <SafeImage
                alt={slide.altText || slide.title}
                className="object-cover"
                fallback={null}
                fill
                sizes="288px"
                src={slide.imageUrl}
              />
            ) : (
              <div className="grid h-full place-items-center text-xs font-semibold text-[var(--color-text-muted)]">
                No banner yet
              </div>
            )}
          </div>
          <ImageDropzone
            compact
            disabled={uploading || saving}
            hint={BANNER_HINT}
            label={uploading ? "Uploading…" : slide.imageUrl ? "Replace banner" : "Upload banner"}
            onFiles={onUpload}
          />
        </div>
        <div className="grid content-start gap-3">
          <Select
            helpText="A product slide opens the product page and hides itself while the product is unavailable."
            label="Promotes product"
            onChange={(event) => {
              const product = productsById.get(event.target.value);
              onChange(
                product
                  ? { ...slide, productId: product.id, href: `/products/${product.slug}` }
                  : { ...slide, productId: undefined },
              );
            }}
            value={slide.productId ?? ""}
          >
            <option value="">None (custom link)</option>
            {linkedProduct && !products.includes(linkedProduct) ? (
              <option value={linkedProduct.id}>{linkedProduct.name} (unavailable)</option>
            ) : null}
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          <Input
            label="Slide title"
            onChange={(event) => onChange({ ...slide, title: event.target.value })}
            value={slide.title}
          />
          {slide.productId ? null : (
            <Input
              helpText="A Sunflour link starting with /, e.g. /menu?category=cakes"
              label="Destination link"
              onChange={(event) => onChange({ ...slide, href: event.target.value })}
              value={slide.href}
            />
          )}
          <Input
            helpText="Read aloud by screen readers. Left empty, it uses the title."
            label="Image description (optional)"
            onChange={(event) => onChange({ ...slide, altText: event.target.value })}
            value={slide.altText}
          />
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button disabled={uploading} loading={saving} onClick={onSave}>
          {isNew ? "Add slide" : "Save changes"}
        </Button>
      </div>
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

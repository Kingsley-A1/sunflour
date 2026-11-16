"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Route } from "next";
import { AlertCircle, FileText, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AdminUploadField } from "@/components/admin/admin-upload-field";
import { ProductVariantsEditor } from "@/components/admin/product-variants-editor";
import {
  ProductImagesField,
  useProductImageQueue,
} from "@/components/admin/product-images-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminProduct,
  createAdminProductDraft,
  deleteAdminProductDraft,
  getApiErrorMessage,
  updateAdminProduct,
  updateAdminProductDraft,
  type ProductDraftInput,
} from "@/lib/api/client";
import { buildProductImageAltText } from "@/lib/api/product-image-upload";
import { koboToNairaInput, nairaInputToKobo } from "@/lib/formatters";
import type {
  AdminCategory,
  AdminProduct,
  AdminProductDraft,
  ProductDraftData,
  ProductStatus,
  UserRole,
} from "@/types/domain";

interface ProductEditorFormProps {
  categories: AdminCategory[];
  product?: AdminProduct;
  draft?: AdminProductDraft;
  role: UserRole;
}

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Enter the product name."),
  categoryId: z.string().min(1, "Choose a category."),
  basePrice: z.number().int().min(0, "Enter a valid price in naira."),
  status: z.enum(["ACTIVE", "HIDDEN", "OUT_OF_STOCK"]),
});

type DraftSaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

const statusHelp: Record<ProductStatus, string> = {
  ACTIVE: "Customers can see and order it as soon as it is created.",
  HIDDEN: "Saved in the catalog but not shown to customers yet.",
  OUT_OF_STOCK: "Shown as sold out if \"Show when out of stock\" is on.",
};

/** Stable shape for change detection (defaults filled, key order fixed). */
function normalizeDraftData(data: ProductDraftData) {
  return {
    name: data.name ?? "",
    slug: data.slug ?? "",
    categoryId: data.categoryId ?? "",
    description: data.description ?? "",
    basePrice: data.basePrice ?? "",
    status: data.status ?? "ACTIVE",
    showWhenOutOfStock: data.showWhenOutOfStock ?? true,
    isFeatured: data.isFeatured ?? false,
    isPopular: data.isPopular ?? false,
    images: (data.images ?? []).map((image) => image.mediaAssetId),
  };
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
}

export function ProductEditorForm({
  categories,
  product,
  draft,
  role,
}: ProductEditorFormProps) {
  const router = useRouter();
  const draftData: ProductDraftData = draft?.data ?? {};
  const [name, setName] = useState(product?.name ?? draftData.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? draftData.slug ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? draftData.categoryId ?? "",
  );
  const [description, setDescription] = useState(
    product?.description ?? draftData.description ?? "",
  );
  const [basePrice, setBasePrice] = useState(
    product ? koboToNairaInput(product.basePrice) : draftData.basePrice ?? "",
  );
  const [status, setStatus] = useState<ProductStatus>(
    product?.status ?? (draftData.status as ProductStatus | undefined) ?? "ACTIVE",
  );
  const [showWhenOutOfStock, setShowWhenOutOfStock] = useState(
    product?.showWhenOutOfStock ?? draftData.showWhenOutOfStock ?? true,
  );
  const [isFeatured, setIsFeatured] = useState(
    product?.isFeatured ?? draftData.isFeatured ?? false,
  );
  const [isPopular, setIsPopular] = useState(
    product?.isPopular ?? draftData.isPopular ?? false,
  );
  // Edit mode: files chosen here are uploaded and attached by AdminUploadField.
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // Create mode: images upload as soon as they are chosen.
  const imageQueue = useProductImageQueue(product ? [] : draftData.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>(
    draft ? { kind: "saved", at: new Date(draft.updatedAt) } : { kind: "idle" },
  );
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isMediaManager = role === "MEDIA_MANAGER";
  const isCreating = !product;
  // Drafts only apply to the new-product flow (never when editing a product).
  const supportsDrafts = isCreating && isSuperAdmin;

  const draftIdRef = useRef<string | null>(draft?.id ?? null);
  // The save currently in flight, so "Save as draft" and "Create product" can
  // wait for it instead of failing or racing it.
  const inFlightDraftRef = useRef<Promise<boolean> | null>(null);
  // Flips true the instant the product is being created, so an autosave that
  // is still in flight can tell it lost the race and clean up after itself
  // instead of resurrecting a draft for a product that already exists.
  const isFinalizedRef = useRef(false);
  const readyImageKey = imageQueue.readyImages.map((image) => image.mediaAssetId).join(",");
  // The content last written to the server. Autosave only runs when the form
  // differs from it, so simply opening a draft never triggers a save.
  const lastSavedSnapshotRef = useRef<string | null>(
    draft ? JSON.stringify(normalizeDraftData(draftData)) : null,
  );

  function buildDraftData(): ProductDraftData {
    return {
      name,
      slug,
      categoryId,
      description,
      basePrice,
      status,
      showWhenOutOfStock,
      isFeatured,
      isPopular,
      images: imageQueue.readyImages,
    };
  }

  function rememberDraftInUrl(draftId: string) {
    // A refresh or a crash now resumes this same draft instead of starting a
    // second copy of the same product.
    const url = `/admin/products/new?draft=${encodeURIComponent(draftId)}`;
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(window.history.state, "", url);
    }
  }

  async function writeDraft(): Promise<boolean> {
    setDraftSaveState({ kind: "saving" });

    const data = buildDraftData();
    const snapshot = JSON.stringify(normalizeDraftData(data));
    const payload: ProductDraftInput = {
      name: name.trim(),
      data,
    };

    try {
      if (draftIdRef.current) {
        await updateAdminProductDraft(draftIdRef.current, payload);
      } else {
        const created = await createAdminProductDraft(payload);

        // The product was created while this call was in flight. Remove this
        // draft at once, or it would linger under Drafts for a live product.
        if (isFinalizedRef.current) {
          await deleteAdminProductDraft(created.id).catch(() => {});
          return false;
        }

        draftIdRef.current = created.id;
        rememberDraftInUrl(created.id);
      }

      if (isFinalizedRef.current) {
        return false;
      }

      lastSavedSnapshotRef.current = snapshot;
      setDraftSaveState({ kind: "saved", at: new Date() });
      return true;
    } catch (draftError) {
      setDraftSaveState({
        kind: "error",
        message: getApiErrorMessage(draftError, "The draft could not be saved."),
      });
      return false;
    }
  }

  async function persistDraft(): Promise<boolean> {
    if (!supportsDrafts || isFinalizedRef.current) {
      return false;
    }

    // Let the current save finish first; then save the latest values.
    if (inFlightDraftRef.current) {
      await inFlightDraftRef.current;
    }

    const pending = writeDraft();
    inFlightDraftRef.current = pending;

    try {
      return await pending;
    } finally {
      if (inFlightDraftRef.current === pending) {
        inFlightDraftRef.current = null;
      }
    }
  }

  // Keep a ref to the latest persistDraft so the debounced autosave always runs
  // the current closure without re-subscribing on every keystroke.
  const persistDraftRef = useRef(persistDraft);
  const buildDraftDataRef = useRef(buildDraftData);

  useEffect(() => {
    persistDraftRef.current = persistDraft;
    buildDraftDataRef.current = buildDraftData;
  });

  useEffect(() => {
    if (!supportsDrafts || isSaving) {
      return;
    }

    const hasContent =
      [name, slug, categoryId, description, basePrice].some(
        (value) => value.trim().length > 0,
      ) || readyImageKey.length > 0;

    if (!hasContent) {
      return;
    }

    const handle = setTimeout(() => {
      const current = JSON.stringify(normalizeDraftData(buildDraftDataRef.current()));
      if (current !== lastSavedSnapshotRef.current) {
        void persistDraftRef.current();
      }
    }, 1500);

    return () => clearTimeout(handle);
  }, [
    supportsDrafts,
    isSaving,
    name,
    slug,
    categoryId,
    description,
    basePrice,
    status,
    showWhenOutOfStock,
    isFeatured,
    isPopular,
    readyImageKey,
  ]);

  async function saveDraftAndExit() {
    setError(null);
    const unchanged =
      draftIdRef.current !== null &&
      JSON.stringify(normalizeDraftData(buildDraftData())) === lastSavedSnapshotRef.current;
    const saved = unchanged || (await persistDraft());

    if (saved) {
      router.push("/admin/products/drafts" as Route);
      router.refresh();
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = productFormSchema.safeParse({
      name,
      categoryId: isMediaManager ? product?.categoryId : categoryId,
      basePrice: isMediaManager ? product?.basePrice : nairaInputToKobo(basePrice),
      status: isMediaManager ? product?.status : status,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the product form.");
      return;
    }

    if (isCreating) {
      if (imageQueue.pendingCount > 0) {
        setError("Wait for the photos to finish uploading, then create the product.");
        return;
      }

      if (imageQueue.failedCount > 0) {
        setError("Some photos failed to upload. Retry or remove them first.");
        return;
      }

      if (imageQueue.readyImages.length < 1) {
        setError("Add at least one photo before creating the product.");
        return;
      }
    }

    setIsSaving(true);

    try {
      const contentPayload = {
        name: name.trim(),
        slug: slug || undefined,
        description: description || null,
        isFeatured,
        isPopular,
      };

      if (product) {
        await updateAdminProduct(
          product.id,
          isMediaManager
            ? contentPayload
            : {
                ...contentPayload,
                categoryId,
                basePrice: nairaInputToKobo(basePrice),
                status,
                showWhenOutOfStock,
              },
        );
        router.replace("/admin/products");
        router.refresh();
        return;
      }

      // Settle any autosave first so we know exactly which draft this is.
      if (inFlightDraftRef.current) {
        await inFlightDraftRef.current;
      }

      const submittedDraftId = draftIdRef.current;
      const readyImages = imageQueue.readyImages;

      await createAdminProduct({
        ...contentPayload,
        categoryId,
        basePrice: nairaInputToKobo(basePrice),
        status,
        showWhenOutOfStock,
        images: readyImages.map((image, index) => ({
          mediaAssetId: image.mediaAssetId,
          altText: buildProductImageAltText(name, index, readyImages.length),
          isPrimary: index === 0,
          sortOrder: index,
        })),
        // The server deletes this draft in the same transaction.
        draftId: submittedDraftId ?? undefined,
      });

      isFinalizedRef.current = true;

      // Rare race: a draft created after we submitted. Clean it up too.
      const lateDraftId = draftIdRef.current;
      if (lateDraftId && lateDraftId !== submittedDraftId) {
        await deleteAdminProductDraft(lateDraftId).catch(() => {});
      }
      draftIdRef.current = null;

      router.replace("/admin/products?created=1" as Route);
      router.refresh();
    } catch (productError) {
      setError(
        getApiErrorMessage(
          productError,
          "Product could not be saved. Check the form and try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  const draftStatusText =
    draftSaveState.kind === "saving"
      ? "Saving draft…"
      : draftSaveState.kind === "saved"
        ? `Draft saved ${formatClock(draftSaveState.at)}`
        : draftSaveState.kind === "error"
          ? `Draft not saved: ${draftSaveState.message}`
          : "Your progress saves as a draft automatically.";

  const imageStatusText =
    isCreating && imageQueue.pendingCount > 0
      ? `Uploading ${imageQueue.pendingCount} ${imageQueue.pendingCount === 1 ? "photo" : "photos"}…`
      : null;

  return (
    <form className="grid gap-5 pb-4" noValidate onSubmit={saveProduct}>
      {isCreating ? (
        <ProductImagesField queue={imageQueue} />
      ) : (
        <AdminUploadField
          existingImages={product?.images}
          onSelectedFilesChange={setSelectedFiles}
          productId={product?.id}
          productName={name}
          selectedFiles={selectedFiles}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="m-0 text-lg font-bold">Details</h2>
          <Input
            autoComplete="off"
            label="Product name"
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Chocolate fudge cake"
            value={name}
          />
          <Textarea
            label="Description (optional)"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
          {product ? (
            <Input
              helpText="Leave blank to generate from the product name."
              label="Slug"
              onChange={(event) => setSlug(event.target.value)}
              value={slug}
            />
          ) : null}
        </section>

        <aside className="grid gap-5">
          <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="m-0 text-lg font-bold">Price and category</h2>
            <Select
              disabled={!isSuperAdmin}
              label="Category"
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="">Choose category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Input
              disabled={!isSuperAdmin}
              helpText={
                product?.variants.some((variant) => variant.isActive)
                  ? "This product has sizes, so customers pay the size price below."
                  : undefined
              }
              inputMode="decimal"
              label="Price (₦)"
              onChange={(event) => setBasePrice(event.target.value)}
              placeholder="e.g. 15000"
              value={basePrice}
            />
          </section>

          {product && !isMediaManager ? (
            <ProductVariantsEditor
              canEdit={isSuperAdmin}
              productId={product.id}
              variants={product.variants}
            />
          ) : null}

          <section className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="m-0 text-lg font-bold">Visibility</h2>
            <div className="grid gap-2">
              <Select
                disabled={!isSuperAdmin}
                label="Status"
                onChange={(event) => setStatus(event.target.value as ProductStatus)}
                value={status}
              >
                <option value="ACTIVE">Active — on the menu</option>
                <option value="HIDDEN">Hidden — not on the menu yet</option>
                <option value="OUT_OF_STOCK">Out of stock</option>
              </Select>
              <p className="m-0 text-xs leading-5 text-[var(--color-text-muted)]">
                {statusHelp[status]}
              </p>
            </div>
            <Checkbox
              checked={showWhenOutOfStock}
              disabled={!isSuperAdmin}
              label="Show when out of stock"
              onChange={(event) => setShowWhenOutOfStock(event.target.checked)}
            />
            <Checkbox
              checked={isFeatured}
              label="Featured product"
              onChange={(event) => setIsFeatured(event.target.checked)}
            />
            <Checkbox
              checked={isPopular}
              label="Popular product"
              onChange={(event) => setIsPopular(event.target.checked)}
            />
          </section>
        </aside>
      </div>

      <div className="sticky bottom-3 z-[calc(var(--layer-header)-1)] grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-floating)] p-3 shadow-[var(--shadow-floating)]">
        {error ? (
          <p
            className="m-0 flex items-start gap-2 text-sm font-semibold text-[var(--color-danger)]"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p
            className={
              draftSaveState.kind === "error"
                ? "m-0 text-xs font-medium text-[var(--color-danger)] sm:text-sm"
                : "m-0 text-xs text-[var(--color-text-muted)] sm:text-sm"
            }
            role="status"
          >
            {imageStatusText ?? (supportsDrafts ? draftStatusText : null)}
          </p>
          <div
            className={
              supportsDrafts
                ? "grid grid-cols-2 gap-2 sm:flex sm:justify-end"
                : "flex justify-end gap-2"
            }
          >
            {supportsDrafts ? (
              <Button
                disabled={isSaving}
                icon={<FileText className="h-4 w-4" aria-hidden="true" />}
                onClick={saveDraftAndExit}
                variant="secondary"
              >
                <span className="sm:hidden">Save draft</span>
                <span className="hidden sm:inline">Save draft and exit</span>
              </Button>
            ) : null}
            <Button
              disabled={isCreating && imageQueue.pendingCount > 0}
              icon={<Save className="h-4 w-4" aria-hidden="true" />}
              loading={isSaving}
              type="submit"
            >
              {product ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

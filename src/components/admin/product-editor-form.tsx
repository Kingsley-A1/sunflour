"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Route } from "next";
import { FileText, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AdminUploadField } from "@/components/admin/admin-upload-field";
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
import { uploadProductImageFiles } from "@/lib/api/product-image-upload";
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
  name: z.string().trim().min(1, "Enter product name."),
  categoryId: z.string().min(1, "Choose a category."),
  basePrice: z.number().int().min(0, "Enter a valid price."),
  status: z.enum(["ACTIVE", "HIDDEN", "OUT_OF_STOCK"]),
});

type DraftSaveState = "idle" | "saving" | "saved" | "error";

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
    product?.status ?? (draftData.status as ProductStatus) ?? "ACTIVE",
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>("idle");
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isMediaManager = role === "MEDIA_MANAGER";
  // Drafts only apply to the new-product flow (never when editing a product).
  const supportsDrafts = !product && isSuperAdmin;

  const draftIdRef = useRef<string | null>(draft?.id ?? null);
  const isPersistingDraftRef = useRef(false);

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
    };
  }

  async function persistDraft(): Promise<boolean> {
    if (!supportsDrafts || isPersistingDraftRef.current) {
      return false;
    }

    isPersistingDraftRef.current = true;
    setDraftSaveState("saving");

    const payload: ProductDraftInput = {
      name: name.trim(),
      data: buildDraftData(),
    };

    try {
      if (draftIdRef.current) {
        await updateAdminProductDraft(draftIdRef.current, payload);
      } else {
        const created = await createAdminProductDraft(payload);
        draftIdRef.current = created.id;
      }

      setDraftSaveState("saved");
      return true;
    } catch {
      setDraftSaveState("error");
      return false;
    } finally {
      isPersistingDraftRef.current = false;
    }
  }

  // Keep a ref to the latest persistDraft so the debounced autosave always runs
  // the current closure without re-subscribing on every keystroke.
  const persistDraftRef = useRef(persistDraft);

  useEffect(() => {
    persistDraftRef.current = persistDraft;
  });

  useEffect(() => {
    if (!supportsDrafts || isSaving) {
      return;
    }

    const hasContent = [
      name,
      slug,
      categoryId,
      description,
      basePrice,
    ].some((value) => value.trim().length > 0);

    if (!hasContent) {
      return;
    }

    const handle = setTimeout(() => {
      void persistDraftRef.current();
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
  ]);

  async function discardDraftAfterCreate() {
    if (!draftIdRef.current) {
      return;
    }

    try {
      await deleteAdminProductDraft(draftIdRef.current);
    } catch {
      // A leftover draft is harmless; it can be deleted manually later.
    }

    draftIdRef.current = null;
  }

  async function saveDraftAndExit() {
    setError(null);
    const saved = await persistDraft();

    if (saved) {
      router.push("/admin/products?view=drafts" as Route);
      router.refresh();
    } else {
      setError("The draft could not be saved. Check your connection and retry.");
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

    if (!product && selectedFiles.length < 1) {
      setError("Choose at least one product image before saving.");
      return;
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
      } else {
        const images = await uploadProductImageFiles(selectedFiles, name);

        await createAdminProduct({
          ...contentPayload,
          categoryId,
          basePrice: nairaInputToKobo(basePrice),
          status,
          showWhenOutOfStock,
          images,
        });

        await discardDraftAfterCreate();
      }

      router.replace("/admin/products");
      router.refresh();
    } catch (productError) {
      setError(
        getApiErrorMessage(
          productError,
          "Product could not be saved. Check validation and admin permission.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={saveProduct}>
      {error ? (
        <p
          className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <AdminUploadField
        existingImages={product?.images}
        onSelectedFilesChange={setSelectedFiles}
        productId={product?.id}
        productName={name}
        selectedFiles={selectedFiles}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="m-0 text-xl font-bold">Product details</h2>
          <Input
            label="Product name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <Textarea
            label="Description (optional)"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
          {product ? (
            <Input
              helpText="Optional. Leave blank to generate from product name."
              label="Slug"
              onChange={(event) => setSlug(event.target.value)}
              value={slug}
            />
          ) : null}
        </section>

        <aside className="grid gap-5">
          <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="m-0 text-lg font-bold">Pricing and category</h2>
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
              inputMode="decimal"
              label="Base price in naira"
              onChange={(event) => setBasePrice(event.target.value)}
              value={basePrice}
            />
          </section>

          {product ? (
            <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h2 className="m-0 text-lg font-bold">Visibility</h2>
              <Select
                disabled={!isSuperAdmin}
                label="Status"
                onChange={(event) => setStatus(event.target.value as ProductStatus)}
                value={status}
              >
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_STOCK">Out of stock</option>
                <option value="HIDDEN">Hidden</option>
              </Select>
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
          ) : (
            <section className="grid gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <h2 className="m-0 text-sm font-bold">Almost done</h2>
              <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
                New products go live as Active. You can set featured, popular,
                status, and variants from the product edit page after creating it.
              </p>
            </section>
          )}
        </aside>
      </div>

      <div className="sticky bottom-4 z-[var(--layer-raised)] flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-floating)] p-3 shadow-[var(--shadow-floating)] sm:flex-row sm:items-center sm:justify-between">
        {supportsDrafts ? (
          <p className="m-0 text-sm text-[var(--color-text-muted)]" role="status">
            {draftSaveState === "saving"
              ? "Saving draft…"
              : draftSaveState === "saved"
                ? "Draft saved. You can close and resume later."
                : draftSaveState === "error"
                  ? "Draft not saved. Check your connection."
                  : "Progress autosaves as a draft."}
          </p>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {supportsDrafts ? (
            <Button
              icon={<FileText className="h-4 w-4" aria-hidden="true" />}
              onClick={saveDraftAndExit}
              type="button"
              variant="secondary"
            >
              Save as draft
            </Button>
          ) : null}
          <Button
            icon={<Save className="h-4 w-4" aria-hidden="true" />}
            loading={isSaving}
            type="submit"
          >
            {product ? "Save and close" : "Create product"}
          </Button>
        </div>
      </div>
    </form>
  );
}

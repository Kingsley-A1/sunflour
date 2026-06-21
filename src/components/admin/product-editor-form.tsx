"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { z } from "zod";
import { AdminUploadField } from "@/components/admin/admin-upload-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminProduct,
  getApiErrorMessage,
  updateAdminProduct,
} from "@/lib/api/client";
import { koboToNairaInput, nairaInputToKobo } from "@/lib/formatters";
import type {
  AdminCategory,
  AdminProduct,
  ProductStatus,
  UserRole,
} from "@/types/domain";

interface ProductEditorFormProps {
  categories: AdminCategory[];
  product?: AdminProduct;
  role: UserRole;
}

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Enter product name."),
  categoryId: z.string().min(1, "Choose a category."),
  basePrice: z.number().int().min(0, "Enter a valid price."),
  status: z.enum(["ACTIVE", "HIDDEN", "OUT_OF_STOCK"]),
});

export function ProductEditorForm({
  categories,
  product,
  role,
}: ProductEditorFormProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(koboToNairaInput(product?.basePrice));
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "ACTIVE");
  const [showWhenOutOfStock, setShowWhenOutOfStock] = useState(
    product?.showWhenOutOfStock ?? true,
  );
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isPopular, setIsPopular] = useState(product?.isPopular ?? false);
  const [variantName, setVariantName] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isMediaManager = role === "MEDIA_MANAGER";

  async function saveProduct() {
    setError(null);
    setMessage(null);

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

    setIsSaving(true);

    try {
      const contentPayload = {
        name,
        slug: slug || undefined,
        description: description || null,
        isFeatured,
        isPopular,
      };
      const payload = isMediaManager
        ? contentPayload
        : {
            ...contentPayload,
            categoryId,
            basePrice: nairaInputToKobo(basePrice),
            status,
            showWhenOutOfStock,
            variants:
              !product && variantName
                ? [
                    {
                      name: variantName,
                      price: nairaInputToKobo(variantPrice),
                      isActive: true,
                    },
                  ]
                : undefined,
          };

      const saved = product
        ? await updateAdminProduct(product.id, payload)
        : await createAdminProduct(payload);

      setMessage("Product saved. Product price changes affect future orders only; old invoices keep their snapshots.");
      if (!product) {
        window.location.href = `/admin/products/${saved.id}`;
      }
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <h2 className="m-0 text-xl font-bold">{product ? "Edit product" : "Create product"}</h2>
          <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            {isMediaManager
              ? "Media manager access can update product content and images only."
              : "Backend validation remains authoritative. Prices are stored in minor units and old invoices do not change after edits."}
          </p>
        </div>
        {error ? <p className="m-0 text-sm font-semibold text-[var(--color-danger)]">{error}</p> : null}
        {message ? <p className="m-0 text-sm font-semibold text-[var(--color-success)]">{message}</p> : null}
        <Input label="Product name" onChange={(event) => setName(event.target.value)} value={name} />
        <Input
          helpText="Optional. Leave blank to generate from product name."
          label="Slug"
          onChange={(event) => setSlug(event.target.value)}
          value={slug}
        />
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
        <Textarea label="Description" onChange={(event) => setDescription(event.target.value)} value={description} />
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
        {!product && isSuperAdmin ? (
          <div className="grid gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-3">
            <h3 className="m-0 text-base font-bold">Optional first variant</h3>
            <Input label="Variant name" onChange={(event) => setVariantName(event.target.value)} value={variantName} />
            <Input
              inputMode="decimal"
              label="Variant price in naira"
              onChange={(event) => setVariantPrice(event.target.value)}
              value={variantPrice}
            />
          </div>
        ) : null}
        <Button
          icon={<Save className="h-4 w-4" aria-hidden="true" />}
          loading={isSaving}
          onClick={saveProduct}
        >
          Save product
        </Button>
      </section>
      <aside className="grid gap-4">
        {product ? (
          <>
            <section className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h2 className="m-0 text-lg font-bold">Current media</h2>
              {product.images.length === 0 ? (
                <p className="m-0 text-sm text-[var(--color-text-muted)]">No images attached.</p>
              ) : (
                <div className="grid gap-3">
                  {product.images.map((image) => (
                    <div className="grid gap-2" key={image.id}>
                      {image.mediaAsset.publicUrl ? (
                        <SafeImage
                          alt={image.altText ?? product.name}
                          className="aspect-[4/3] rounded-[var(--radius-sm)] object-cover"
                          fallback={
                            <div className="grid aspect-[4/3] place-items-center rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 text-center text-sm font-semibold text-[var(--color-text-muted)]">
                              Image unavailable
                            </div>
                          }
                          height={240}
                          src={image.mediaAsset.publicUrl}
                          width={320}
                        />
                      ) : null}
                      <p className="m-0 text-xs text-[var(--color-text-muted)]">
                        {image.altText ?? "No alt text"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <AdminUploadField productId={product.id} />
          </>
        ) : (
          <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="m-0 text-lg font-bold">Image upload</h2>
            <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Save the product first, then upload images through the signed R2 flow.
            </p>
          </section>
        )}
      </aside>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
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
  getApiErrorMessage,
  updateAdminProduct,
} from "@/lib/api/client";
import { uploadProductImageFiles } from "@/lib/api/product-image-upload";
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
  const router = useRouter();
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isMediaManager = role === "MEDIA_MANAGER";

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
          variants: variantName
            ? [
                {
                  name: variantName,
                  price: nairaInputToKobo(variantPrice),
                  isActive: true,
                },
              ]
            : undefined,
        });
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
          <div>
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Step 2</p>
            <h2 className="m-0 mt-1 text-xl font-bold">Product details</h2>
            <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Lead with the customer-facing name and description. The slug is generated automatically when left blank.
            </p>
          </div>
          <Input
            label="Product name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <Textarea
            label="Description"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
          <Input
            helpText="Optional. Leave blank to generate from product name."
            label="Slug"
            onChange={(event) => setSlug(event.target.value)}
            value={slug}
          />

          {!product && isSuperAdmin ? (
            <fieldset className="grid gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-3">
              <legend className="px-1 text-base font-bold">Optional first variant</legend>
              <Input
                label="Variant name"
                onChange={(event) => setVariantName(event.target.value)}
                value={variantName}
              />
              <Input
                inputMode="decimal"
                label="Variant price in naira"
                onChange={(event) => setVariantPrice(event.target.value)}
                value={variantPrice}
              />
            </fieldset>
          ) : null}
        </section>

        <aside className="grid gap-5">
          <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div>
              <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Step 3</p>
              <h2 className="m-0 mt-1 text-lg font-bold">Pricing and category</h2>
            </div>
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

          <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div>
              <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Step 4</p>
              <h2 className="m-0 mt-1 text-lg font-bold">Visibility</h2>
            </div>
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
        </aside>
      </div>

      <div className="sticky bottom-4 z-[var(--layer-raised)] flex justify-end rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-floating)] p-3 shadow-[var(--shadow-floating)]">
        <Button
          icon={<Save className="h-4 w-4" aria-hidden="true" />}
          loading={isSaving}
          type="submit"
        >
          {product ? "Save and close" : "Create product"}
        </Button>
      </div>
    </form>
  );
}

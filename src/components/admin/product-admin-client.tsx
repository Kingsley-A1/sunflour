"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  apiRequest,
  getApiErrorMessage,
  updateAdminProductStatus,
} from "@/lib/api/client";
import { formatNairaFromKobo } from "@/lib/formatters";
import { productStatusMeta } from "@/lib/status";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill";
import type {
  AdminCategory,
  AdminProduct,
  ProductStatus,
  UserRole,
} from "@/types/domain";

interface ProductAdminClientProps {
  products: AdminProduct[];
  categories: AdminCategory[];
  role: UserRole;
}

export function ProductAdminClient({
  products,
  categories,
  role,
}: ProductAdminClientProps) {
  const router = useRouter();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ProductStatus>>({});
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    product: AdminProduct;
    nextStatus: ProductStatus;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const visibleProducts = useMemo(
    () =>
      products
        .filter((product) => !deletedIds.includes(product.id))
        .map((product) => ({
          ...product,
          status: statusOverrides[product.id] ?? product.status,
        })),
    [products, statusOverrides, deletedIds],
  );

  const filteredProducts = useMemo(
    () =>
      visibleProducts.filter((product) => {
        const categoryMatches =
          categoryId === "all" || product.categoryId === categoryId;
        const statusMatches = status === "all" || product.status === status;

        return categoryMatches && statusMatches;
      }),
    [categoryId, visibleProducts, status],
  );

  const isSuperAdmin = role === "SUPER_ADMIN";
  const canEditProductContent =
    role === "SUPER_ADMIN" || role === "MEDIA_MANAGER";
  const canUpdateAvailability =
    role === "SUPER_ADMIN" || role === "MODERATOR";

  function statusOptionsFor(product: AdminProduct): ProductStatus[] {
    if (isSuperAdmin) {
      return ["ACTIVE", "OUT_OF_STOCK", "HIDDEN"];
    }

    return product.status === "HIDDEN"
      ? ["HIDDEN"]
      : ["ACTIVE", "OUT_OF_STOCK"];
  }

  async function updateStatus() {
    if (!pendingStatusChange) {
      return;
    }

    setMessage(null);
    setError(null);
    setIsSaving(true);

    try {
      await updateAdminProductStatus({
        productId: pendingStatusChange.product.id,
        status: pendingStatusChange.nextStatus,
        reason: "Updated from catalog admin UI.",
      });
      setStatusOverrides((current) => ({
        ...current,
        [pendingStatusChange.product.id]: pendingStatusChange.nextStatus,
      }));
      setMessage("Product availability updated for future browsing and checkout.");
      setPendingStatusChange(null);
      router.refresh();
    } catch (statusError) {
      setError(getApiErrorMessage(statusError, "Status update failed."));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProduct() {
    if (!pendingDelete) {
      return;
    }

    setMessage(null);
    setError(null);
    setIsDeleting(true);

    try {
      await apiRequest(`/api/v1/admin/products/${pendingDelete.id}`, {
        method: "DELETE",
      });
      setDeletedIds((current) => [...current, pendingDelete.id]);
      setMessage(`${pendingDelete.name} was deleted from the catalog.`);
      setPendingDelete(null);
      router.refresh();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Delete failed."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Category filter"
            onChange={(event) => setCategoryId(event.target.value)}
            value={categoryId}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Status filter"
            onChange={(event) => setStatus(event.target.value as ProductStatus | "all")}
            value={status}
          >
            <option value="all">All statuses</option>
            {Object.entries(productStatusMeta).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </div>
        {isSuperAdmin ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
            href="/admin/products/new"
          >
            Create product
          </Link>
        ) : (
          <p className="m-0 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
            Staff permissions are least-privilege: moderators update
            availability, media managers update product content and images, and
            super admins control pricing and creation.
          </p>
        )}
      </div>
      {message ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success)]" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {filteredProducts.length === 0 ? (
        <EmptyState
          description="No catalog items match the current filters."
          title="No products"
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--color-surface-muted)]">
              <tr>
                <th className="w-full p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Availability</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr className="border-t border-[var(--color-border)]" key={product.id}>
                  <td className="p-3 font-semibold">{product.name}</td>
                  <td className="p-3 text-[var(--color-text-muted)]">
                    {product.category.name}
                  </td>
                  <td className="p-3 tabular-nums">
                    {formatNairaFromKobo(product.basePrice)}
                  </td>
                  <td className="p-3">
                    <StatusPill status={product.status} />
                  </td>
                  <td className="p-3">
                    <select
                      aria-label={`Update availability for ${product.name}`}
                      className="min-h-10 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2"
                      disabled={
                        !canUpdateAvailability ||
                        (!isSuperAdmin && product.status === "HIDDEN")
                      }
                      onChange={(event) => {
                        const nextStatus = event.target.value as ProductStatus;

                        if (nextStatus !== product.status) {
                          setPendingStatusChange({ product, nextStatus });
                        }
                      }}
                      value={product.status}
                    >
                      {statusOptionsFor(product).map((value) => (
                        <option key={value} value={value}>
                          {productStatusMeta[value].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {canEditProductContent ? (
                        <Link
                          className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 font-semibold"
                          href={`/admin/products/${product.id}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </Link>
                      ) : (
                        <span className="text-sm text-[var(--color-text-muted)]">
                          Restricted
                        </span>
                      )}
                      {isSuperAdmin ? (
                        <button
                          className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-danger)] px-3 font-semibold text-[var(--color-danger)] transition hover:bg-[var(--color-danger-soft)]"
                          onClick={() => setPendingDelete(product)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        confirmLabel="Update availability"
        description={
          pendingStatusChange
            ? `Set ${pendingStatusChange.product.name} to ${productStatusMeta[pendingStatusChange.nextStatus].label}. This affects future public browsing and checkout availability.`
            : "Confirm this product availability update."
        }
        destructive={pendingStatusChange?.nextStatus === "HIDDEN"}
        loading={isSaving}
        onCancel={() => setPendingStatusChange(null)}
        onConfirm={updateStatus}
        open={Boolean(pendingStatusChange)}
        title="Confirm product availability change"
      />
      <ConfirmDialog
        confirmLabel="Delete product"
        description={
          pendingDelete
            ? `Delete ${pendingDelete.name} from the catalog? It will be removed from the public menu. Past orders keep their saved details.`
            : "Confirm this product deletion."
        }
        destructive
        loading={isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={deleteProduct}
        open={Boolean(pendingDelete)}
        title="Delete product"
      />
    </div>
  );
}

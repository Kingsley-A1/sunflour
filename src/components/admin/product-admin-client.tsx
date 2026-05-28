"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { formatNairaFromKobo } from "@/lib/formatters";
import { productStatusMeta } from "@/lib/status";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill";
import type { AdminCategory, AdminProduct, ProductStatus } from "@/types/domain";

interface ProductAdminClientProps {
  products: AdminProduct[];
  categories: AdminCategory[];
}

export function ProductAdminClient({
  products,
  categories,
}: ProductAdminClientProps) {
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [message, setMessage] = useState<string | null>(null);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const categoryMatches =
          categoryId === "all" || product.categoryId === categoryId;
        const statusMatches = status === "all" || product.status === status;

        return categoryMatches && statusMatches;
      }),
    [categoryId, products, status],
  );

  async function updateStatus(productId: string, nextStatus: ProductStatus) {
    setMessage(null);
    await apiRequest(`/api/v1/admin/products/${productId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: nextStatus,
        reason: "Updated from catalog admin UI.",
      }),
    });
    setMessage("Status update saved. Refresh to see the latest backend state.");
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
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
          href="/admin/products/new"
        >
          Create product
        </Link>
      </div>
      {message ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success)]">
          {message}
        </p>
      ) : null}
      {filteredProducts.length === 0 ? (
        <EmptyState
          description="No catalog items match the current filters."
          title="No products"
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--color-surface-soft)]">
              <tr>
                <th className="p-3">Product</th>
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
                      className="min-h-10 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2"
                      onChange={(event) =>
                        updateStatus(product.id, event.target.value as ProductStatus)
                      }
                      value={product.status}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="OUT_OF_STOCK">Out of stock</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <Link
                      className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 font-semibold"
                      href={`/admin/products/${product.id}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

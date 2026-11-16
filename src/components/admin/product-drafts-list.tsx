"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Trash2 } from "lucide-react";
import { PreviewImage } from "@/components/admin/preview-image";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { deleteAdminProductDraft, getApiErrorMessage } from "@/lib/api/client";
import { formatDateTime, formatNairaFromKobo, nairaInputToKobo } from "@/lib/formatters";
import type { AdminProductDraft } from "@/types/domain";

interface ProductDraftsListProps {
  drafts: AdminProductDraft[];
  error: string | null;
  categoryNames: Record<string, string>;
  /** Lower-cased names of products that already exist in the catalog. */
  existingProductNames: string[];
}

function normalizeName(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function draftDisplayName(draft: AdminProductDraft): string {
  return draft.name.trim() || draft.data.name?.trim() || "Untitled draft";
}

function missingFields(draft: AdminProductDraft): string[] {
  const data = draft.data;
  const missing: string[] = [];

  if (!normalizeName(data.name ?? draft.name)) missing.push("name");
  if (!data.categoryId) missing.push("category");
  if (!data.basePrice?.trim()) missing.push("price");
  if (!data.images?.length) missing.push("photos");

  return missing;
}

function formatDraftPrice(value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const kobo = nairaInputToKobo(value);
  return Number.isFinite(kobo) && kobo >= 0 ? formatNairaFromKobo(kobo) : null;
}

type PendingDelete = { kind: "one"; draft: AdminProductDraft } | { kind: "leftovers" };

export function ProductDraftsList({
  drafts,
  error,
  categoryNames,
  existingProductNames,
}: ProductDraftsListProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const existingNames = useMemo(
    () => new Set(existingProductNames),
    [existingProductNames],
  );
  const visibleDrafts = drafts.filter((draft) => !hiddenIds.includes(draft.id));
  const leftovers = visibleDrafts.filter((draft) => {
    const name = normalizeName(draft.data.name ?? draft.name);
    return name.length > 0 && existingNames.has(name);
  });
  const leftoverIds = new Set(leftovers.map((draft) => draft.id));

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    const targets =
      pendingDelete.kind === "one" ? [pendingDelete.draft] : leftovers;

    setIsDeleting(true);
    setActionError(null);

    const removed: string[] = [];
    try {
      for (const draft of targets) {
        await deleteAdminProductDraft(draft.id);
        removed.push(draft.id);
      }
      setPendingDelete(null);
    } catch (deleteError) {
      setActionError(
        getApiErrorMessage(deleteError, "The draft could not be deleted."),
      );
    } finally {
      setHiddenIds((current) => [...current, ...removed]);
      setIsDeleting(false);
      router.refresh();
    }
  }

  if (error) {
    return <ErrorState description={error} title="Drafts unavailable" />;
  }

  return (
    <div className="grid gap-4">
      {actionError ? (
        <p
          className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}

      {leftovers.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 flex items-start gap-2 text-sm leading-6 text-[var(--color-warning-text)]">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>
                {leftovers.length} {leftovers.length === 1 ? "draft has" : "drafts have"} the
                same name as a product that already exists.
              </strong>{" "}
              They are usually left over from an earlier attempt.
            </span>
          </p>
          <Button
            icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setPendingDelete({ kind: "leftovers" })}
            size="sm"
            variant="danger-outline"
          >
            Delete leftovers
          </Button>
        </div>
      ) : null}

      {visibleDrafts.length === 0 ? (
        <EmptyState
          description="When you start a product and leave before creating it, it is saved here so you can finish it later."
          title="No drafts"
        />
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 2xl:grid-cols-3">
          {visibleDrafts.map((draft) => {
            const cover = draft.data.images?.[0]?.url ?? null;
            const imageCount = draft.data.images?.length ?? 0;
            const price = formatDraftPrice(draft.data.basePrice);
            const category = draft.data.categoryId
              ? categoryNames[draft.data.categoryId] ?? "Unknown category"
              : null;
            const missing = missingFields(draft);
            const isLeftover = leftoverIds.has(draft.id);

            return (
              <li
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                key={draft.id}
              >
                <div className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]">
                  <PreviewImage label="No photo yet" src={cover} />
                </div>
                <div className="grid min-w-0 content-start gap-1">
                  <h3 className="m-0 truncate text-base font-bold">
                    {draftDisplayName(draft)}
                  </h3>
                  <p className="m-0 truncate text-sm text-[var(--color-text-muted)]">
                    {[category, price, imageCount ? `${imageCount} ${imageCount === 1 ? "photo" : "photos"}` : null]
                      .filter(Boolean)
                      .join(" · ") || "Nothing filled in yet"}
                  </p>
                  <p className="m-0 text-xs text-[var(--color-text-soft)]">
                    Saved {formatDateTime(draft.updatedAt)}
                  </p>
                  {isLeftover ? (
                    <p className="m-0 text-xs font-semibold text-[var(--color-warning-text)]">
                      A product with this name already exists.
                    </p>
                  ) : missing.length > 0 ? (
                    <p className="m-0 text-xs font-semibold text-[var(--color-text-muted)]">
                      Still needs: {missing.join(", ")}
                    </p>
                  ) : (
                    <p className="m-0 text-xs font-semibold text-[var(--color-success-text)]">
                      Ready to create
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
                      href={`/admin/products/new?draft=${draft.id}`}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Button
                      aria-label={`Delete draft ${draftDisplayName(draft)}`}
                      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => setPendingDelete({ kind: "one", draft })}
                      size="sm"
                      variant="ghost"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        confirmLabel={pendingDelete?.kind === "leftovers" ? `Delete ${leftovers.length}` : "Delete draft"}
        description={
          pendingDelete?.kind === "one"
            ? `Delete the draft "${draftDisplayName(pendingDelete.draft)}"? This cannot be undone.`
            : `Delete ${leftovers.length} leftover ${leftovers.length === 1 ? "draft" : "drafts"} whose product already exists? The live products are not affected.`
        }
        destructive
        loading={isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        open={Boolean(pendingDelete)}
        title={pendingDelete?.kind === "leftovers" ? "Delete leftover drafts" : "Delete draft"}
      />
    </div>
  );
}

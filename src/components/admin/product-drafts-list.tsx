"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { deleteAdminProductDraft, getApiErrorMessage } from "@/lib/api/client";
import { formatDateTime } from "@/lib/formatters";
import type { AdminProductDraft } from "@/types/domain";

interface ProductDraftsListProps {
  drafts: AdminProductDraft[];
  error: string | null;
}

export function ProductDraftsList({ drafts, error }: ProductDraftsListProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<AdminProductDraft | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await deleteAdminProductDraft(pendingDelete.id);
      setPendingDelete(null);
      router.refresh();
    } catch (deleteError) {
      setActionError(
        getApiErrorMessage(deleteError, "The draft could not be deleted."),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (error) {
    return <ErrorState description={error} title="Drafts unavailable" />;
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-text-muted)]">
        Draft products are saved, unfinished product entries. They never appear
        on the public menu or in checkout. Resume one to finish creating it, or
        delete it if it is no longer needed. Selected images are not stored in a
        draft and must be re-selected when you resume.
      </div>
      {actionError ? (
        <p
          className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}
      {drafts.length === 0 ? (
        <EmptyState
          description="Unfinished products you save while creating will appear here so you can resume later."
          title="No draft products"
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-[40rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--color-surface-muted)]">
              <tr>
                <th className="p-3">Draft</th>
                <th className="p-3">Last saved</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft) => (
                <tr
                  className="border-t border-[var(--color-border)]"
                  key={draft.id}
                >
                  <td className="p-3 font-semibold">
                    {draft.name.trim() || "Untitled draft"}
                  </td>
                  <td className="p-3 text-[var(--color-text-muted)]">
                    {formatDateTime(draft.updatedAt)}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-on-primary)]"
                        href={`/admin/products/new?draft=${draft.id}`}
                      >
                        Resume
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <Button
                        icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => setPendingDelete(draft)}
                        variant="ghost"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        confirmLabel="Delete draft"
        description={
          pendingDelete
            ? `Delete the draft "${pendingDelete.name.trim() || "Untitled draft"}"? This cannot be undone.`
            : "Delete this draft?"
        }
        destructive
        loading={isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        open={Boolean(pendingDelete)}
        title="Delete draft product"
      />
    </div>
  );
}

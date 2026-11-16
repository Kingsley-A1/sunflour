import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft } from "lucide-react";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import { ErrorState } from "@/components/ui/error-state";
import {
  getAdminCatalogSafe,
  getAdminProductDraftSafe,
} from "@/lib/api/server";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create Product",
};

interface AdminNewProductPageProps {
  searchParams: Promise<{ draft?: string }>;
}

export default async function AdminNewProductPage({
  searchParams,
}: AdminNewProductPageProps) {
  const user = await requireRole(SUPER_ADMIN_ROLES);
  const { draft: draftId } = await searchParams;
  const [{ categories, error }, draftResult] = await Promise.all([
    getAdminCatalogSafe(),
    draftId
      ? getAdminProductDraftSafe(draftId, user)
      : Promise.resolve({ draft: null, error: null }),
  ]);

  const isResuming = Boolean(draftResult.draft);

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            href={(isResuming ? "/admin/products/drafts" : "/admin/products") as Route}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {isResuming ? "Drafts" : "Products"}
          </Link>
          <h1 className="m-0 mt-1 text-2xl font-extrabold sm:text-3xl">
            {isResuming ? "Finish product" : "New product"}
          </h1>
        </div>
      </header>
      {error ? <ErrorState description={error} title="Catalog unavailable" /> : null}
      {draftResult.error ? (
        <ErrorState description={draftResult.error} title="Draft unavailable" />
      ) : null}
      <ProductEditorForm
        categories={categories}
        draft={draftResult.draft ?? undefined}
        // Remount when switching drafts so form state never leaks between them.
        key={draftResult.draft?.id ?? "new"}
        role="SUPER_ADMIN"
      />
    </div>
  );
}

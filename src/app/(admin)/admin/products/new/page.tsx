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

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Catalog</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">
          {draftResult.draft ? "Resume product draft" : "Create product"}
        </h1>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Your progress is saved automatically as a draft. You can close this
          page and resume later from the Draft products view.
        </p>
      </header>
      {error ? <ErrorState description={error} title="Catalog unavailable" /> : null}
      {draftResult.error ? (
        <ErrorState description={draftResult.error} title="Draft unavailable" />
      ) : null}
      <ProductEditorForm
        categories={categories}
        draft={draftResult.draft ?? undefined}
        role="SUPER_ADMIN"
      />
    </div>
  );
}

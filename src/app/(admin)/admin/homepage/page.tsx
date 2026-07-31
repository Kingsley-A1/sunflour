import { HomepageMerchandisingClient } from "@/components/admin/homepage-merchandising-client";
import { ErrorState } from "@/components/ui/error-state";
import {
  getAdminCatalogSafe,
  getAdminHomepageMerchandisingSafe,
} from "@/lib/api/server";
import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Homepage Merchandising",
};

export default async function AdminHomepagePage() {
  const user = await requireRole(PRODUCT_CONTENT_ROLES);
  const [catalog, merchandisingResult] = await Promise.all([
    getAdminCatalogSafe(),
    getAdminHomepageMerchandisingSafe(),
  ]);

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Public site
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">
          Homepage merchandising
        </h1>
        <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          Manage promotional banners and Sunflour&apos;s weekly offers.
        </p>
      </header>
      {catalog.error ? (
        <ErrorState description={catalog.error} title="Catalog unavailable" />
      ) : null}
      {merchandisingResult.error || !merchandisingResult.merchandising ? (
        <ErrorState
          description={
            merchandisingResult.error ??
            "Homepage merchandising settings are unavailable."
          }
          title="Homepage settings unavailable"
        />
      ) : (
        <HomepageMerchandisingClient
          initialSettings={merchandisingResult.merchandising}
          products={catalog.products}
          role={user.role}
        />
      )}
    </div>
  );
}

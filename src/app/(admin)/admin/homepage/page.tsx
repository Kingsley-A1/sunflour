import { HomepageMerchandisingClient } from "@/components/admin/homepage-merchandising-client";
import { ErrorState } from "@/components/ui/error-state";
import { getAdminHomepageMerchandisingSafe } from "@/lib/api/server";
import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Homepage Merchandising",
};

export default async function AdminHomepagePage() {
  const user = await requireRole(PRODUCT_CONTENT_ROLES);
  const merchandisingResult = await getAdminHomepageMerchandisingSafe();

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
          Manage the promotional banners that rotate at the top of the homepage.
        </p>
      </header>
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
          role={user.role}
        />
      )}
    </div>
  );
}

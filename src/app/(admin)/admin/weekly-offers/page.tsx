import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { WeeklyOffersClient } from "@/components/admin/weekly-offers-client";
import { ErrorState } from "@/components/ui/error-state";
import {
  getAdminCatalogSafe,
  getAdminHomepageMerchandisingSafe,
} from "@/lib/api/server";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Weekly Offers",
};

export default async function AdminWeeklyOffersPage() {
  // The weekly-offers write API is super-admin only, so the page is too.
  await requireRole(SUPER_ADMIN_ROLES);
  const [catalog, merchandisingResult] = await Promise.all([
    getAdminCatalogSafe(),
    getAdminHomepageMerchandisingSafe(),
  ]);

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
            Storefront
          </p>
          <h1 className="m-0 mt-2 text-3xl font-extrabold">Weekly offers</h1>
          <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            Schedule &quot;buy this, get that free&quot; deals. A live offer
            appears on the homepage, the product page, and the public Weekly
            Offers page.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center gap-2 self-start rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] sm:self-auto"
          href="/weekly-offers"
          rel="noopener"
          target="_blank"
        >
          View public page
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </header>
      {catalog.error ? (
        <ErrorState description={catalog.error} title="Catalog unavailable" />
      ) : null}
      {merchandisingResult.error || !merchandisingResult.merchandising ? (
        <ErrorState
          description={
            merchandisingResult.error ?? "Weekly offers are unavailable."
          }
          title="Weekly offers unavailable"
        />
      ) : (
        <WeeklyOffersClient
          initialOffers={merchandisingResult.merchandising.weeklyOffers}
          products={catalog.products}
        />
      )}
    </div>
  );
}

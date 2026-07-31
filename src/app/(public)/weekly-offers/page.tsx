import { WeeklyOfferCard } from "@/components/commerce/weekly-offer-card";
import { PageHero } from "@/components/layout/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { getWeeklyOffersSafe } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Weekly Offers",
  description:
    "This week's Sunflour Bakery offer plus every offer we have run before.",
  alternates: { canonical: "/weekly-offers" },
};

export default async function WeeklyOffersPage() {
  const { current, upcoming, past } = await getWeeklyOffersSafe();

  return (
    <>
      <PageHero
        eyebrow="Weekly offers"
        title={
          <>
            Buy this, get{" "}
            <span className="sf-text-gradient">that free</span>
          </>
        }
      />
      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-8">
        <section className="grid gap-4">
          <h2 className="m-0 text-2xl font-extrabold">This week</h2>
          {current ? (
            <WeeklyOfferCard offer={current} tone="current" />
          ) : (
            <EmptyState
              description="There is no offer running right now. Check back soon — a new one lands every week."
              title="No offer this week"
            />
          )}
        </section>

        {upcoming.length > 0 ? (
          <section className="grid gap-4">
            <h2 className="m-0 text-2xl font-extrabold">Coming soon</h2>
            <div className="grid gap-4">
              {upcoming.map((offer) => (
                <WeeklyOfferCard key={offer.id} offer={offer} tone="upcoming" />
              ))}
            </div>
          </section>
        ) : null}

        {past.length > 0 ? (
          <section className="grid gap-4">
            <h2 className="m-0 text-2xl font-extrabold">Past offers</h2>
            <div className="grid gap-4">
              {past.map((offer) => (
                <WeeklyOfferCard key={offer.id} offer={offer} tone="past" />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}

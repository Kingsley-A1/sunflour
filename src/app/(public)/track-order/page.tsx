import { PageHero } from "@/components/layout/page-hero";
import { TrackOrderClient } from "./track-order-client";

export const metadata = {
  title: "Track your order",
  description: "Check the status of your Sunflour Bakery order with your order number and phone.",
  alternates: { canonical: "/track-order" },
};

interface TrackOrderPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const { order } = await searchParams;

  return (
    <>
      <PageHero eyebrow="Orders" title="Track your order" />
      <main className="mx-auto grid max-w-2xl gap-6 px-4 py-8">
        <TrackOrderClient initialOrderNumber={order?.slice(0, 80) ?? ""} />
      </main>
    </>
  );
}

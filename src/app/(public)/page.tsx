import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, ReceiptText, ShieldCheck, Truck } from "lucide-react";
import heroImage from "../../../menu.jpg";
import { ProductGrid } from "@/components/commerce/product-grid";
import { ErrorState } from "@/components/ui/error-state";
import { getPublicMenuSafe } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { menu, error } = await getPublicMenuSafe();
  const popularProducts =
    menu?.categories
      .flatMap((category) => category.products)
      .filter((product) => product.isPopular || product.isFeatured)
      .slice(0, 4) ?? [];

  return (
    <main>
      <section className="relative min-h-[clamp(28rem,calc(100svh-8rem),42rem)] overflow-hidden">
        <Image
          alt="Sunflour Bakery menu selection"
          className="absolute inset-0 h-full w-full object-cover"
          fill
          priority
          sizes="100vw"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-[var(--color-bg)]" />
        <div className="relative mx-auto flex min-h-[clamp(28rem,calc(100svh-8rem),42rem)] max-w-6xl items-end px-4 pb-10 pt-16">
          <div className="max-w-2xl text-white">
            <p className="m-0 text-sm font-bold uppercase">
              Welcome to Sunflour
            </p>
            <h1 className="m-0 mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
              Fresh bakery orders with clear checkout and invoice access.
            </h1>
            <p className="m-0 mt-4 max-w-xl text-base leading-7 text-white/85">
              Browse the menu, choose pickup or delivery, see fees before
              ordering, then pay by Moniepoint transfer and send proof on
              WhatsApp.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 text-base font-bold text-[var(--color-on-primary)]"
                href="/menu"
              >
                View menu
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-sm)] border border-white/70 px-5 text-base font-bold text-white"
                href="/cart"
              >
                Review cart
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-4">
        {[
          {
            icon: Clock,
            title: "Fast browsing",
            body: "Find items quickly from the official menu.",
          },
          {
            icon: Truck,
            title: "Clear delivery",
            body: "Base fee and 6 PM surcharge are shown separately.",
          },
          {
            icon: ReceiptText,
            title: "Invoice ready",
            body: "Every order gets a traceable invoice immediately.",
          },
          {
            icon: ShieldCheck,
            title: "Manual verification",
            body: "Payment is confirmed only after staff review.",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              key={item.title}
            >
              <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="m-0 mt-3 text-base font-bold">{item.title}</h2>
              <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                {item.body}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Popular picks
            </p>
            <h2 className="m-0 mt-1 text-3xl font-extrabold">Start with the menu</h2>
          </div>
          <Link className="text-sm font-bold text-[var(--color-primary)] hover:underline" href="/menu">
            See all products
          </Link>
        </div>
        {error ? (
          <ErrorState description={error} title="Menu unavailable" />
        ) : (
          <ProductGrid products={popularProducts} />
        )}
      </section>
    </main>
  );
}

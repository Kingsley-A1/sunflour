import Link from "next/link";
import type { Metadata, Route } from "next";
import {
  ArrowRight,
  Clock,
  HandCoins,
  ReceiptText,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "About Sunflour Bakery",
  description:
    "Learn how Sunflour Bakery keeps ordering clear, fresh, and operationally disciplined.",
};

const commitments = [
  {
    icon: Clock,
    title: "Fresh, practical ordering",
    body: "The menu is built for quick browsing, simple decisions, and mobile customers who want to order without confusion.",
  },
  {
    icon: Truck,
    title: "Clear pickup and delivery",
    body: "Pickup, delivery zones, base fees, and the 6 PM delivery surcharge are presented before an order is placed.",
  },
  {
    icon: ReceiptText,
    title: "Traceable invoices",
    body: "Every order receives invoice access so customers and staff can see the exact order snapshot.",
  },
];

const orderingSteps = [
  "Browse the official menu and choose the items you want.",
  "Review the cart, delivery choice, and any delivery fee before checkout.",
  "Place the order and receive Moniepoint transfer instructions.",
  "Send payment proof through WhatsApp for staff review.",
  "Sunflour confirms payment manually before preparing or releasing the order.",
];

export default function AboutPage() {
  return (
    <main>
      <PageHero
        actions={
          <>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-on-primary)]"
              href="/menu"
            >
              Browse menu
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-bold text-[var(--color-text)]"
              href={"/contact" as Route}
            >
              Contact Sunflour
            </Link>
          </>
        }
        description="Sunflour keeps menu browsing, pickup, delivery, payment review, and invoice access understandable from the first tap."
        eyebrow="About Sunflour"
        title={
          <>
            Fresh bakery ordering,{" "}
            <span className="sf-text-gradient">handled with clarity.</span>
          </>
        }
      />

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
            Our standard
          </p>
          <h2 className="m-0 mt-2 text-3xl font-extrabold leading-tight">
            Simple for customers. Disciplined for the business.
          </h2>
        </div>
        <div className="grid gap-4">
          <p className="m-0 text-base leading-7 text-[var(--color-text-muted)]">
            Sunflour&apos;s public ordering flow is designed to make the next action
            obvious. Customers can browse, add items, choose pickup or delivery,
            and see payment instructions after checkout without a surprise login
            wall or vague payment status.
          </p>
          <p className="m-0 text-base leading-7 text-[var(--color-text-muted)]">
            Behind the interface, the platform protects the operational rules
            that matter: staff confirm manual payments, delivery fees are shown
            clearly, and invoices keep a snapshot of what the customer ordered.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-3">
        {commitments.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]"
              key={item.title}
            >
              <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="m-0 mt-4 text-lg font-extrabold">{item.title}</h2>
              <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                {item.body}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]">
          <HandCoins className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
          <h2 className="m-0 mt-4 text-2xl font-extrabold">
            Manual payment, handled honestly
          </h2>
          <p className="m-0 mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Sunflour uses Moniepoint transfer for v1. The system does not tell a
            customer that payment is confirmed until staff verify it. This keeps
            the customer message accurate and protects the business from
            accidental fulfilment.
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]">
          <ShieldCheck
            className="h-6 w-6 text-[var(--color-primary)]"
            aria-hidden="true"
          />
          <h2 className="m-0 mt-4 text-2xl font-extrabold">How ordering works</h2>
          <ol className="m-0 mt-4 grid list-decimal gap-3 pl-5 text-sm leading-6 text-[var(--color-text-muted)]">
            {orderingSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import type { Metadata, Route } from "next";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Sunflour Bakery",
  description:
    "Plain-language terms for using Sunflour Bakery's ordering platform.",
};

const termsSections = [
  {
    title: "1. Using this platform",
    body: "This platform helps customers browse Sunflour Bakery's menu, create orders, receive invoice access, and follow manual payment instructions. Use accurate contact and delivery details so staff can process your order correctly.",
  },
  {
    title: "2. Menu, availability, and pricing",
    body: "Products, variants, prices, and availability can change. The order total shown at checkout is calculated by the platform. Old invoices keep the order details captured when the order was placed.",
  },
  {
    title: "3. Pickup and delivery",
    body: "Pickup has no delivery fee. Delivery fees depend on the delivery zone selected at checkout. Delivery orders placed from 6:00 PM may include the active evening surcharge when the business rule is enabled.",
  },
  {
    title: "4. Manual Moniepoint payment",
    body: "Sunflour uses manual Moniepoint transfer in this version. Payment instructions are shown after checkout. The platform must not treat payment as confirmed until Sunflour staff verifies it.",
  },
  {
    title: "5. Payment proof and order progress",
    body: "Customers may be asked to send payment proof through WhatsApp. Sending proof does not guarantee confirmation. Staff review the proof and update the order before preparation or fulfilment continues.",
  },
  {
    title: "6. Changes, cancellations, and rejected orders",
    body: "If an order needs to be changed or cancelled, contact Sunflour as early as possible. Orders may be rejected or cancelled where payment cannot be verified, product availability changes, delivery cannot be completed, or the request conflicts with operating policy.",
  },
  {
    title: "7. Reviews",
    body: "Submitted reviews may be moderated before they appear publicly. Sunflour may reject reviews that are abusive, unsafe, spammy, unrelated, or misleading.",
  },
  {
    title: "8. Accounts and security",
    body: "Customers are responsible for using accurate account information and protecting their sign-in access. Admin-only actions are restricted to authorized staff.",
  },
];

export default function TermsPage() {
  return (
    <main>
      <section className="bg-[var(--color-canvas-muted)]">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
            Terms
          </p>
          <h1 className="m-0 mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
            Terms of service
          </h1>
          <p className="m-0 mt-4 text-base leading-7 text-[var(--color-text-muted)]">
            These terms explain the practical rules for using Sunflour Bakery&apos;s
            ordering platform. They are written to keep ordering, payment,
            delivery, and review expectations clear.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-4 py-10">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]">
          <CheckCircle2
            className="h-6 w-6 text-[var(--color-success)]"
            aria-hidden="true"
          />
          <h2 className="m-0 mt-4 text-2xl font-extrabold">
            The most important rule
          </h2>
          <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            A transfer is not confirmed just because it was initiated or proof
            was sent. Sunflour staff must verify payment before the order moves
            forward as paid.
          </p>
        </div>

        {termsSections.map((section) => (
          <article
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            key={section.title}
          >
            <h2 className="m-0 text-xl font-extrabold">{section.title}</h2>
            <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              {section.body}
            </p>
          </article>
        ))}

        <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="m-0 text-xl font-extrabold">9. Questions</h2>
          <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            For order support or questions about these terms, use the{" "}
            <Link
              className="font-bold text-[var(--color-primary)] hover:underline"
              href={"/contact" as Route}
            >
              contact page
            </Link>
            .
          </p>
        </article>
      </section>
    </main>
  );
}

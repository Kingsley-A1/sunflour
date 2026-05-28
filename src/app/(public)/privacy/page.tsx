import Link from "next/link";
import type { Metadata, Route } from "next";
import { LockKeyhole, MailCheck, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Sunflour Bakery",
  description:
    "Plain-language privacy information for Sunflour Bakery customers.",
};

const privacySections = [
  {
    title: "Information we collect",
    body: "Sunflour may collect the details needed to browse, order, deliver, support, and invoice: name, phone number, email address, delivery address, order details, account details, review content, and operational status history.",
  },
  {
    title: "How we use information",
    body: "Information is used to process orders, show invoices, support pickup or delivery, review payment proof, send transactional email, improve operations, protect the platform, and comply with business record needs.",
  },
  {
    title: "Payments",
    body: "Sunflour uses manual Moniepoint transfer in this version. The platform shows transfer instructions but does not collect card details. Payment proof may be sent through WhatsApp and reviewed by authorized staff.",
  },
  {
    title: "Emails and messages",
    body: "Transactional messages may include order confirmations, invoices, password resets, new-order alerts, order status updates, and appreciation messages after delivery. Marketing campaigns are not part of the current approved email scope.",
  },
  {
    title: "Accounts, sessions, and security",
    body: "Authentication and session data may be used to keep customers and admins signed in securely. Admin permissions are enforced server-side, and sensitive business actions are expected to be audited.",
  },
  {
    title: "Sharing",
    body: "Sunflour uses service providers needed to run the platform, such as hosting, database, email, storage, authentication, and communication tools. Information is not sold as a product.",
  },
  {
    title: "Retention",
    body: "Order, invoice, payment, audit, and account information may be kept where needed for operations, support, accounting, security, or legal obligations. Public reviews appear only after approval.",
  },
  {
    title: "Your choices",
    body: "You can contact Sunflour to ask about your order or customer information. Some records may need to be kept where they are required for business integrity, security, or compliance.",
  },
];

export default function PrivacyPage() {
  return (
    <main>
      <section className="bg-[var(--color-bg-subtle)]">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
            Privacy
          </p>
          <h1 className="m-0 mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
            Privacy policy
          </h1>
          <p className="m-0 mt-4 text-base leading-7 text-[var(--color-text-muted)]">
            This page explains how Sunflour Bakery handles customer and order
            information in the ordering platform.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-4 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Purpose-limited",
              body: "Data supports orders, invoices, delivery, support, and operations.",
            },
            {
              icon: LockKeyhole,
              title: "Protected access",
              body: "Admin and customer access should stay permission-based.",
            },
            {
              icon: MailCheck,
              title: "Transactional email",
              body: "Messages are tied to approved operational use cases.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]"
                key={item.title}
              >
                <Icon
                  className="h-5 w-5 text-[var(--color-primary)]"
                  aria-hidden="true"
                />
                <h2 className="m-0 mt-4 text-lg font-extrabold">{item.title}</h2>
                <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {item.body}
                </p>
              </article>
            );
          })}
        </div>

        {privacySections.map((section) => (
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
          <h2 className="m-0 text-xl font-extrabold">Contact</h2>
          <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            For privacy or order-support questions, use the{" "}
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

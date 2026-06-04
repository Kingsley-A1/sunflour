import Link from "next/link";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Camera,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import { getPublicContactConfig } from "@/server/config/public-contact";

export const metadata: Metadata = {
  title: "Contact Sunflour Bakery",
  description:
    "Contact Sunflour Bakery by phone, WhatsApp, email, social channels, or address.",
};

interface ContactAction {
  title: string;
  body: string;
  value: string | null;
  href: string | null;
  icon: LucideIcon;
  external?: boolean;
}

export default function ContactPage() {
  const contact = getPublicContactConfig();
  const primaryActions: ContactAction[] = [
    {
      title: "Phone",
      body: "Call Sunflour for direct ordering or order support.",
      value: contact.phoneNumber,
      href: contact.phoneHref,
      icon: Phone,
    },
    {
      title: "WhatsApp",
      body: "Send payment proof or ask for help after checkout.",
      value: contact.whatsappNumber,
      href: contact.whatsappHref,
      icon: MessageCircle,
      external: true,
    },
    {
      title: "Email",
      body: "Use email for invoice, account, or business questions.",
      value: contact.emailAddress,
      href: contact.emailHref,
      icon: Mail,
    },
  ];
  const socialActions: ContactAction[] = [
    {
      title: "Instagram",
      body: "Follow Sunflour updates and product posts.",
      value: contact.instagram,
      href: contact.instagramHref,
      icon: Camera,
      external: true,
    },
    {
      title: "TikTok",
      body: "Watch quick product and bakery updates.",
      value: contact.tiktok,
      href: contact.tiktokHref,
      icon: Sparkles,
      external: true,
    },
    {
      title: "Facebook",
      body: "Find Sunflour on Facebook.",
      value: contact.facebook,
      href: contact.facebookHref,
      icon: ExternalLink,
      external: true,
    },
  ];

  return (
    <main>
      <section className="bg-[var(--color-bg-subtle)]">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Contact
            </p>
            <h1 className="m-0 mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
              Reach Sunflour without guessing the right channel.
            </h1>
            <p className="m-0 mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
              Use the contact options below for orders, payment proof, invoice
              questions, pickup, delivery, and general support.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
            <ReceiptText
              className="h-6 w-6 text-[var(--color-primary)]"
              aria-hidden="true"
            />
            <h2 className="m-0 mt-4 text-xl font-extrabold">
              Already checked out?
            </h2>
            <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Send payment proof through WhatsApp after placing the order.
              Payment remains under review until Sunflour staff confirms it.
            </p>
          </div>
        </div>
      </section>

      {!contact.hasAnyContact ? (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-4 text-sm leading-6 text-[var(--color-text)]">
            Contact details are not configured yet. Add the public contact
            values in the environment file so this page can show live business
            details.
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
        {primaryActions.map((action) => (
          <ContactCard action={action} key={action.title} />
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
          <MapPin className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
          <h2 className="m-0 mt-4 text-2xl font-extrabold">Address</h2>
          {contact.address ? (
            <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              {contact.address}
            </p>
          ) : (
            <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Address is not configured yet.
            </p>
          )}
          {contact.mapsHref ? (
            <a
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-bold hover:bg-[var(--color-surface-soft)]"
              href={contact.mapsHref}
              rel="noreferrer"
              target="_blank"
            >
              Open in maps
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {socialActions.map((action) => (
            <ContactCard action={action} compact key={action.title} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-12 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="m-0 text-2xl font-extrabold">Ready to order?</h2>
          <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Browse the menu first so your cart, delivery option, and invoice are
            created through the platform.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 text-base font-bold text-[var(--color-on-primary)]"
          href="/menu"
        >
          Browse menu
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

function ContactCard({
  action,
  compact = false,
}: {
  action: ContactAction;
  compact?: boolean;
}) {
  const Icon = action.icon;

  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
      <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
      <h2 className="m-0 mt-4 text-lg font-extrabold">{action.title}</h2>
      <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        {action.body}
      </p>
      {action.href && action.value ? (
        <a
          className="mt-4 inline-flex min-h-11 max-w-full items-center justify-center gap-2 break-all rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-bold hover:bg-[var(--color-surface-soft)]"
          href={action.href}
          rel={action.external ? "noreferrer" : undefined}
          target={action.external ? "_blank" : undefined}
        >
          {compact ? action.value : `Open ${action.title}`}
          {action.external ? (
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : null}
        </a>
      ) : (
        <p className="m-0 mt-4 text-sm font-semibold text-[var(--color-text-soft)]">
          Not configured
        </p>
      )}
    </article>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/brand-icons";
import { getResolvedPublicContactConfig } from "@/server/config/public-contact";

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
  icon: ReactNode;
  external?: boolean;
}

export default async function ContactPage() {
  const contact = await getResolvedPublicContactConfig();
  const primaryActions: ContactAction[] = [
    {
      title: "Phone",
      body: "Call Sunflour for direct ordering or order support.",
      value: contact.phoneNumber,
      href: contact.phoneHref,
      icon: <Phone className="h-5 w-5" aria-hidden="true" />,
    },
    {
      title: "WhatsApp",
      body: "Send payment proof or ask for help after checkout.",
      value: contact.whatsappNumber,
      href: contact.whatsappHref,
      icon: <WhatsAppIcon className="h-5 w-5" />,
      external: true,
    },
    {
      title: "Email",
      body: "Use email for invoice, account, or business questions.",
      value: contact.emailAddress,
      href: contact.emailHref,
      icon: <Mail className="h-5 w-5" aria-hidden="true" />,
    },
  ];
  const socialActions: ContactAction[] = [
    {
      title: "Instagram",
      body: "Follow Sunflour updates and product posts.",
      value: contact.instagram,
      href: contact.instagramHref,
      icon: <InstagramIcon className="h-5 w-5" />,
      external: true,
    },
    {
      title: "TikTok",
      body: "Watch quick product and bakery updates.",
      value: contact.tiktok,
      href: contact.tiktokHref,
      icon: <TikTokIcon className="h-5 w-5" />,
      external: true,
    },
    {
      title: "Facebook",
      body: "Find Sunflour on Facebook.",
      value: contact.facebook,
      href: contact.facebookHref,
      icon: <FacebookIcon className="h-5 w-5" />,
      external: true,
    },
  ];
  const availablePrimaryActions = primaryActions.filter(
    (action) => action.href && action.value,
  );
  const availableSocialActions = socialActions.filter(
    (action) => action.href && action.value,
  );

  return (
    <main>
      <section className="bg-[var(--color-canvas-muted)]">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Contact
            </p>
            <h1 className="m-0 mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
              Reach {contact.businessName} without guessing the right channel.
            </h1>
            <p className="m-0 mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
              {contact.shortDescription ??
                "Use the contact options below for orders, payment proof, invoice questions, pickup, delivery, and general support."}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]">
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
            Contact details are temporarily unavailable. Browse the menu or try
            again later.
          </div>
        </section>
      ) : null}

      {availablePrimaryActions.length > 0 ? (
        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
          {availablePrimaryActions.map((action) => (
            <ContactCard action={action} key={action.title} />
          ))}
        </section>
      ) : null}

      {contact.address || availableSocialActions.length > 0 ? (
        <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 lg:grid-cols-[1fr_1fr]">
          {contact.address ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]">
              <MapPin
                className="h-6 w-6 text-[var(--color-primary)]"
                aria-hidden="true"
              />
              <h2 className="m-0 mt-4 text-2xl font-extrabold">Address</h2>
              <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                {contact.address}
              </p>
              {contact.mapsHref ? (
                <a
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-bold hover:bg-[var(--color-surface-muted)]"
                  href={contact.mapsHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open in maps
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
              {contact.supportHours ? (
                <p className="m-0 mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
                  Support hours: {contact.supportHours}
                </p>
              ) : null}
            </div>
          ) : null}

          {availableSocialActions.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {availableSocialActions.map((action) => (
                <ContactCard action={action} compact key={action.title} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-12 pt-8 md:grid-cols-[1fr_auto] md:items-center">
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
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]">
      <div className="text-[var(--color-primary)]">{action.icon}</div>
      <h2 className="m-0 mt-4 text-lg font-extrabold">{action.title}</h2>
      <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        {action.body}
      </p>
      {action.href && action.value ? (
        <a
          className="mt-4 inline-flex min-h-11 max-w-full items-center justify-center gap-2 break-all rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-bold hover:bg-[var(--color-surface-muted)]"
          href={action.href}
          rel={action.external ? "noreferrer" : undefined}
          target={action.external ? "_blank" : undefined}
        >
          {compact ? action.value : `Open ${action.title}`}
          {action.external ? (
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : null}
        </a>
      ) : null}
    </article>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ExternalLink, Mail, MapPin, Phone, ReceiptText } from "lucide-react";
import { WhatsAppIcon, InstagramIcon, TikTokIcon, FacebookIcon } from "@/components/ui/brand-icons";
import { PageHero } from "@/components/layout/page-hero";
import { getResolvedPublicContactConfig } from "@/server/config/public-contact";

export const metadata: Metadata = {
  title: "Contact Sunflour Bakery",
  description: "Contact Sunflour Bakery by phone, WhatsApp, email, social channels, or address.",
};

export default async function ContactPage() {
  const contact = await getResolvedPublicContactConfig();

  return (
    <main>
      <PageHero
        aside={
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]">
            <ReceiptText className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="m-0 mt-4 text-xl font-extrabold">Already checked out?</h2>
            <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Send payment proof through WhatsApp after placing the order.
            </p>
          </div>
        }
        eyebrow="Contact"
        title={
          <>
            Reach Sunflour{" "}
            <span className="sf-text-gradient">without the guesswork.</span>
          </>
        }
      />

      {!contact.hasAnyContact ? (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-4 text-sm leading-6">
            Contact details are not configured yet.
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
        <ContactCard
          title="Phone"
          body="Call Sunflour for direct ordering or order support."
          value={contact.phoneNumber}
          href={contact.phoneHref}
          icon={<Phone className="h-5 w-5" aria-hidden="true" />}
        />
        <ContactCard
          title="WhatsApp"
          body="Send payment proof or ask for help after checkout."
          value={contact.whatsappNumber}
          href={contact.whatsappHref}
          external
          icon={<WhatsAppIcon className="h-5 w-5" aria-hidden="true" />}
        />
        <ContactCard
          title="Email"
          body="Use email for invoice, account, or business questions."
          value={contact.emailAddress}
          href={contact.emailHref}
          icon={<Mail className="h-5 w-5" aria-hidden="true" />}
        />
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 lg:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]">
          <MapPin className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
          <h2 className="m-0 mt-4 text-2xl font-extrabold">Address</h2>
          {contact.address ? (
            <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{contact.address}</p>
          ) : (
            <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Address not configured.</p>
          )}
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
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <ContactCard
            compact
            title="Instagram"
            body="Follow Sunflour updates and product posts."
            value={contact.instagram}
            href={contact.instagramHref}
            external
            icon={<InstagramIcon className="h-5 w-5" aria-hidden="true" />}
          />
          <ContactCard
            compact
            title="TikTok"
            body="Watch quick product and bakery updates."
            value={contact.tiktok}
            href={contact.tiktokHref}
            external
            icon={<TikTokIcon className="h-5 w-5" aria-hidden="true" />}
          />
          <ContactCard
            compact
            title="Facebook"
            body="Find Sunflour on Facebook."
            value={contact.facebook}
            href={contact.facebookHref}
            external
            icon={<FacebookIcon className="h-5 w-5" aria-hidden="true" />}
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-12 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="m-0 text-2xl font-extrabold">Ready to order?</h2>
          <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Browse the menu so your cart and invoice are created through the platform.
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
  title,
  body,
  value,
  href,
  icon,
  external = false,
  compact = false,
}: {
  title: string;
  body: string;
  value: string | null;
  href: string | null;
  icon: React.ReactNode;
  external?: boolean;
  compact?: boolean;
}) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]">
      <div className="text-[var(--color-primary)]">{icon}</div>
      <h2 className="m-0 mt-4 text-lg font-extrabold">{title}</h2>
      <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{body}</p>
      {href && value ? (
        <a
          className="mt-4 inline-flex min-h-11 max-w-full items-center justify-center gap-2 break-all rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-bold hover:bg-[var(--color-surface-muted)]"
          href={href}
          rel={external ? "noreferrer" : undefined}
          target={external ? "_blank" : undefined}
        >
          {compact ? value : `Open ${title}`}
          {external ? <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
        </a>
      ) : (
        <p className="m-0 mt-4 text-sm font-semibold text-[var(--color-text-muted)]">Not configured</p>
      )}
    </article>
  );
}

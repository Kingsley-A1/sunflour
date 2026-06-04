import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  Camera,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logoAsset from "../../../logo.png";
import { getPublicContactConfig } from "@/server/config/public-contact";

interface FooterLink {
  href: Route;
  label: string;
}

interface ContactLink {
  label: string;
  value: string | null;
  href: string | null;
  icon: LucideIcon;
  external?: boolean;
}

const exploreLinks: FooterLink[] = [
  { href: "/menu" as Route, label: "Menu" },
  { href: "/about" as Route, label: "About" },
  { href: "/reviews" as Route, label: "Reviews" },
  { href: "/contact" as Route, label: "Contact" },
];

const supportLinks: FooterLink[] = [
  { href: "/cart" as Route, label: "Cart" },
  { href: "/checkout" as Route, label: "Checkout" },
  { href: "/account" as Route, label: "Account" },
];

const legalLinks: FooterLink[] = [
  { href: "/terms" as Route, label: "Terms" },
  { href: "/privacy" as Route, label: "Privacy" },
];

export function Footer() {
  const contact = getPublicContactConfig();
  const currentYear = new Date().getFullYear();
  const contactLinks: ContactLink[] = [
    {
      label: "Phone",
      value: contact.phoneNumber,
      href: contact.phoneHref,
      icon: Phone,
    },
    {
      label: "WhatsApp",
      value: contact.whatsappNumber,
      href: contact.whatsappHref,
      icon: MessageCircle,
      external: true,
    },
    {
      label: "Email",
      value: contact.emailAddress,
      href: contact.emailHref,
      icon: Mail,
    },
    {
      label: "Instagram",
      value: contact.instagram,
      href: contact.instagramHref,
      icon: Camera,
      external: true,
    },
    {
      label: "TikTok",
      value: contact.tiktok,
      href: contact.tiktokHref,
      icon: Sparkles,
      external: true,
    },
    {
      label: "Facebook",
      value: contact.facebook,
      href: contact.facebookHref,
      icon: ExternalLink,
      external: true,
    },
  ];

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr] lg:py-10">
        <section aria-labelledby="footer-brand">
          <Link className="inline-flex items-center gap-3" href="/">
            <Image
              alt="Sunflour Bakery logo"
              className="h-12 w-12 rounded-[var(--radius-sm)] object-contain"
              height={48}
              src={logoAsset}
              width={48}
            />
            <span id="footer-brand" className="text-lg font-extrabold">
              Sunflour Bakery
            </span>
          </Link>
          <p className="m-0 mt-4 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
            Fresh bakery orders with clear pickup, delivery, invoice, and manual
            Moniepoint payment guidance from checkout to confirmation.
          </p>
          <div className="mt-5 grid gap-3 text-sm text-[var(--color-text-muted)] sm:grid-cols-2 lg:grid-cols-1">
            <p className="m-0 flex gap-2">
              <ReceiptText
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                aria-hidden="true"
              />
              Invoices stay tied to the order details shown at checkout.
            </p>
            <p className="m-0 flex gap-2">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                aria-hidden="true"
              />
              Transfer payments are confirmed only after staff verification.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-5 md:col-span-2 lg:contents">
          <FooterNav title="Explore" links={exploreLinks} />

          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact" className="m-0 text-sm font-extrabold">
              Contacts
            </h2>
            <ul className="m-0 mt-3 grid list-none gap-2 p-0">
              {contactLinks.map((item) => (
                <ContactItem item={item} key={item.label} />
              ))}
              <li className="flex min-w-0 gap-2 rounded-[var(--radius-sm)] px-0 py-1.5 text-sm text-[var(--color-text-muted)]">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-[var(--color-text)]">
                    Address
                  </span>
                  {contact.mapsHref ? (
                    <a
                      className="inline max-w-full break-all hover:text-[var(--color-primary)] hover:underline"
                      href={contact.mapsHref}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {contact.address}
                    </a>
                  ) : (
                    <span>Not configured</span>
                  )}
                </span>
              </li>
            </ul>
          </section>
        </div>

        <FooterNav title="Ordering" links={supportLinks} />
      </div>

      <div className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-sm text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">
            Copyright {currentYear} Sunflour Bakery. All rights reserved.
          </p>
          <nav aria-label="Legal navigation" className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                className="font-semibold hover:text-[var(--color-primary)] hover:underline"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterNav({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="m-0 text-sm font-extrabold">{title}</h2>
      <ul className="m-0 mt-3 grid list-none gap-2 p-0">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              className="inline-flex min-h-9 items-center text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:underline"
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ContactItem({ item }: { item: ContactLink }) {
  const Icon = item.icon;

  return (
    <li className="flex min-w-0 gap-2 rounded-[var(--radius-sm)] px-0 py-1.5 text-sm text-[var(--color-text-muted)]">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span className="block font-semibold text-[var(--color-text)]">
          {item.label}
        </span>
        {item.href && item.value ? (
          <a
            className="inline max-w-full break-all hover:text-[var(--color-primary)] hover:underline"
            href={item.href}
            rel={item.external ? "noreferrer" : undefined}
            target={item.external ? "_blank" : undefined}
          >
            {item.value}
          </a>
        ) : (
          <span>Not configured</span>
        )}
      </span>
    </li>
  );
}

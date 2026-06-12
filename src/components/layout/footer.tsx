import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logoAsset from "../../../logo.png";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/ui/brand-icons";
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
  ].filter((item) => item.href && item.value);
  const hasDirectContact = contactLinks.length > 0 || Boolean(contact.address);

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-8 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.2fr] lg:py-10">
        <section
          aria-labelledby="footer-brand"
          className="col-span-2 lg:col-span-1"
        >
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
            Fresh bakes for pickup or delivery, with clear ordering and verified
            transfer payments.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {contact.instagramHref ? (
              <SocialLink
                href={contact.instagramHref}
                icon={<InstagramIcon className="h-5 w-5" />}
                label="Sunflour Bakery on Instagram"
              />
            ) : null}
            {contact.tiktokHref ? (
              <SocialLink
                href={contact.tiktokHref}
                icon={<TikTokIcon className="h-5 w-5" />}
                label="Sunflour Bakery on TikTok"
              />
            ) : null}
            {contact.facebookHref ? (
              <SocialLink
                href={contact.facebookHref}
                icon={<FacebookIcon className="h-5 w-5" />}
                label="Sunflour Bakery on Facebook"
              />
            ) : null}
          </div>
        </section>

        <FooterNav title="Explore" links={exploreLinks} />
        <FooterNav title="Ordering" links={supportLinks} />

        <section
          aria-labelledby="footer-contact"
          className="col-span-2 lg:col-span-1"
        >
          <h2 id="footer-contact" className="m-0 text-sm font-extrabold">
            Contact
          </h2>
          {hasDirectContact ? (
            <ul className="m-0 mt-3 grid list-none gap-2 p-0">
              {contactLinks.map((item) => (
                <ContactItem item={item} key={item.label} />
              ))}
              {contact.address ? (
                <li className="flex min-w-0 gap-2 rounded-[var(--radius-sm)] px-0 py-1.5 text-sm text-[var(--color-text-muted)]">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
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
                      <span>{contact.address}</span>
                    )}
                  </span>
                </li>
              ) : null}
            </ul>
          ) : (
            <Link
              className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
              href="/contact"
            >
              View contact page
            </Link>
          )}
        </section>
      </div>

      <div className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-sm text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">&copy; {currentYear} Sunflour Bakery</p>
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
        ) : null}
      </span>
    </li>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)]"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {icon}
    </a>
  );
}

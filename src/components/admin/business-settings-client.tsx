"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Route } from "next";
import {
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  getApiErrorMessage,
  getBusinessSettings,
  updateBusinessSettings,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const settingsShortcutLinks: Array<{
  href: Route;
  label: string;
  description: string;
}> = [
  {
    href: "/admin/settings/payment" as Route,
    label: "Payment settings",
    description: "Manage the Moniepoint transfer snapshot used by future orders.",
  },
  {
    href: "/admin/settings/email" as Route,
    label: "Transactional email",
    description: "Review the active email templates and transactional mail rules.",
  },
  {
    href: "/admin/delivery" as Route,
    label: "Delivery rules",
    description: "Edit delivery zones, base fees, and the 6 PM surcharge rule.",
  },
  {
    href: "/admin/audit-logs" as Route,
    label: "Audit logs",
    description: "Trace sensitive business changes after settings updates.",
  },
];

export function BusinessSettingsClient() {
  const [businessName, setBusinessName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [supportHours, setSupportHours] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    getBusinessSettings()
      .then((settings) => {
        setBusinessName(settings.businessName);
        setShortDescription(settings.shortDescription ?? "");
        setSupportHours(settings.supportHours ?? "");
        setPhoneNumber(settings.phoneNumber ?? "");
        setWhatsappNumber(settings.whatsappNumber ?? "");
        setEmailAddress(settings.emailAddress ?? "");
        setAddress(settings.address ?? "");
        setInstagram(settings.instagram ?? "");
        setTiktok(settings.tiktok ?? "");
        setFacebook(settings.facebook ?? "");
      })
      .catch(() =>
        setError("Business settings are unavailable for this account."),
      );
  }, []);

  async function saveSettings() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updateBusinessSettings({
        businessName,
        shortDescription,
        supportHours,
        phoneNumber,
        whatsappNumber,
        emailAddress,
        address,
        instagram,
        tiktok,
        facebook,
      });
      setMessage(
        "Business settings saved. Public contact surfaces now use the latest approved details.",
      );
      setConfirmOpen(false);
      setIsEditing(false);
    } catch (settingsError) {
      setError(
        getApiErrorMessage(
          settingsError,
          "Business settings could not be saved. Check the values and try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      {error ? <ErrorState description={error} title="Settings unavailable" /> : null}
      {message ? (
        <p
          className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success)]"
          role="status"
        >
          {message}
        </p>
      ) : null}

      {!isEditing ? (
        <section className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
                Public business profile
              </p>
              <h2 className="m-0 mt-1 text-xl font-bold">
                Contact and social details
              </h2>
              <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
                These values power public contact surfaces. Existing orders and
                invoices keep their original snapshots.
              </p>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="secondary">
              Edit business profile
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SettingsMetric
              icon={<Phone className="h-5 w-5" aria-hidden="true" />}
              label="Phone"
              value={phoneNumber || "Not set"}
            />
            <SettingsMetric
              icon={<MessageCircle className="h-5 w-5" aria-hidden="true" />}
              label="WhatsApp"
              value={whatsappNumber || "Not set"}
            />
            <SettingsMetric
              icon={<Mail className="h-5 w-5" aria-hidden="true" />}
              label="Email"
              value={emailAddress || "Not set"}
            />
            <SettingsMetric
              icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
              label="Address"
              value={address || "Not set"}
            />
          </div>
        </section>
      ) : (
      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
        <div className="grid gap-1">
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
            Public business profile
          </p>
          <h2 className="m-0 text-xl font-bold">Contact and social details</h2>
          <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
            These values power the public footer and contact page. If a field is
            left blank, the platform falls back to the environment-level public
            contact config.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SettingsMetric
            icon={<Phone className="h-5 w-5" aria-hidden="true" />}
            label="Phone"
            value={phoneNumber || "Not set"}
          />
          <SettingsMetric
            icon={<MessageCircle className="h-5 w-5" aria-hidden="true" />}
            label="WhatsApp"
            value={whatsappNumber || "Not set"}
          />
          <SettingsMetric
            icon={<Mail className="h-5 w-5" aria-hidden="true" />}
            label="Email"
            value={emailAddress || "Not set"}
          />
          <SettingsMetric
            icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
            label="Address"
            value={address || "Not set"}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Business name"
                onChange={(event) => setBusinessName(event.target.value)}
                value={businessName}
              />
              <Input
                helpText="Shown on the public contact page when provided."
                label="Support hours"
                onChange={(event) => setSupportHours(event.target.value)}
                placeholder="Mon-Sat, 8am-7pm"
                value={supportHours}
              />
            </div>

            <Textarea
              helpText="Short public description for the footer and contact page."
              label="Short description"
              onChange={(event) => setShortDescription(event.target.value)}
              value={shortDescription}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Phone number"
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+2348012345678"
                value={phoneNumber}
              />
              <Input
                label="WhatsApp number"
                onChange={(event) => setWhatsappNumber(event.target.value)}
                placeholder="+2348012345678"
                value={whatsappNumber}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Support email"
                onChange={(event) => setEmailAddress(event.target.value)}
                placeholder="hello@sunflourbakery.com"
                type="email"
                value={emailAddress}
              />
              <Input
                helpText="Paste a full URL or a plain handle."
                label="Instagram"
                onChange={(event) => setInstagram(event.target.value)}
                placeholder="@sunflourbakery"
                value={instagram}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                helpText="Paste a full URL or a plain handle."
                label="TikTok"
                onChange={(event) => setTiktok(event.target.value)}
                placeholder="@sunflourbakery"
                value={tiktok}
              />
              <Input
                helpText="Paste a full URL or a plain handle."
                label="Facebook"
                onChange={(event) => setFacebook(event.target.value)}
                placeholder="@SunflourBakery"
                value={facebook}
              />
            </div>

            <Textarea
              helpText="Used for the public contact page and map link."
              label="Address"
              onChange={(event) => setAddress(event.target.value)}
              value={address}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="m-0 text-sm text-[var(--color-text-muted)]">
                Changes apply to future public page renders only. Order
                snapshots and invoices do not change.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => setConfirmOpen(true)}>Review and save</Button>
                <Button onClick={() => setIsEditing(false)} variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
                <h3 className="m-0 text-base font-bold">Live surface</h3>
              </div>
              <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Review the current public contact surface after each save.
              </p>
              <Link
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold hover:bg-[var(--color-surface-muted)]"
                href="/contact"
                target="_blank"
              >
                Open contact page
              </Link>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
              <h3 className="m-0 text-base font-bold">Settings shortcuts</h3>
              <div className="mt-3 grid gap-3">
                {settingsShortcutLinks.map((item) => (
                  <Link
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 hover:bg-[var(--color-surface-muted)]"
                    href={item.href}
                    key={item.href}
                  >
                    <p className="m-0 text-sm font-semibold">{item.label}</p>
                    <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
      )}

      <ConfirmDialog
        confirmLabel="Save business settings"
        description="This updates the public footer and contact page details used by future renders. Existing orders and invoices will not change."
        loading={isSaving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={saveSettings}
        open={confirmOpen}
        title="Confirm business settings update"
      >
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          Business name: {businessName || "Not set"}
        </p>
      </ConfirmDialog>
    </div>
  );
}

function SettingsMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <div className="flex items-center gap-2 text-[var(--color-primary)]">
        {icon}
        <p className="m-0 text-sm font-semibold text-[var(--color-text)]">
          {label}
        </p>
      </div>
      <p className="m-0 mt-3 break-words text-sm text-[var(--color-text-muted)]">
        {value}
      </p>
    </article>
  );
}

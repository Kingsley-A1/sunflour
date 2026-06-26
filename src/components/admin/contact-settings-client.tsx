"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ContactValues {
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  emailAddress?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  address?: string | null;
}

export function ContactSettingsClient() {
  const [values, setValues] = useState<ContactValues>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/admin/settings/contacts")
      .then((r) => r.json())
      .then((payload: { ok?: boolean; data?: { contacts: ContactValues | null } }) => {
        if (payload?.ok && payload.data?.contacts) {
          setValues(payload.data.contacts);
        }
      })
      .catch(() => {});
  }, []);

  function update(field: keyof ContactValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const body = {
        phoneNumber: values.phoneNumber?.trim() || null,
        whatsappNumber: values.whatsappNumber?.trim() || null,
        emailAddress: values.emailAddress?.trim() || null,
        instagram: values.instagram?.trim() || null,
        tiktok: values.tiktok?.trim() || null,
        facebook: values.facebook?.trim() || null,
        address: values.address?.trim() || null,
      };

      const response = await fetch("/api/v1/admin/settings/contacts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: { message?: string } };

      if (payload?.ok) {
        setMessage("Contact settings saved.");
      } else {
        setError(payload?.error?.message ?? "Failed to save. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="m-0 text-xl font-bold">Contact details</h2>
        <Input
          label="Phone number"
          value={values.phoneNumber ?? ""}
          onChange={(e) => update("phoneNumber", e.target.value)}
        />
        <Input
          label="WhatsApp number"
          helpText="Digits only or full wa.me URL."
          value={values.whatsappNumber ?? ""}
          onChange={(e) => update("whatsappNumber", e.target.value)}
        />
        <Input
          label="Email address"
          type="email"
          value={values.emailAddress ?? ""}
          onChange={(e) => update("emailAddress", e.target.value)}
        />
        <Input
          label="Instagram"
          helpText="Handle (e.g. @sunflourbakery) or full URL."
          value={values.instagram ?? ""}
          onChange={(e) => update("instagram", e.target.value)}
        />
        <Input
          label="TikTok"
          helpText="Handle (e.g. @sunflourbakery) or full URL."
          value={values.tiktok ?? ""}
          onChange={(e) => update("tiktok", e.target.value)}
        />
        <Input
          label="Facebook"
          helpText="Handle or full URL."
          value={values.facebook ?? ""}
          onChange={(e) => update("facebook", e.target.value)}
        />
        <Input
          label="Physical address"
          helpText="Shown on the contact page and linked to Google Maps."
          value={values.address ?? ""}
          onChange={(e) => update("address", e.target.value)}
        />
      </section>

      {error ? (
        <p className="m-0 text-sm font-semibold text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="m-0 text-sm font-semibold text-[var(--color-success)]" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          icon={<Save className="h-4 w-4" aria-hidden="true" />}
          loading={isSaving}
          onClick={save}
        >
          Save contacts
        </Button>
      </div>
    </div>
  );
}

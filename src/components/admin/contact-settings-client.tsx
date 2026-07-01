"use client";

import { useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
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

type FieldKey = keyof ContactValues;

const FIELDS: { key: FieldKey; label: string; help?: string; type?: string }[] = [
  { key: "phoneNumber", label: "Phone number" },
  { key: "whatsappNumber", label: "WhatsApp number", help: "Digits only or full wa.me URL." },
  { key: "emailAddress", label: "Email address", type: "email" },
  { key: "instagram", label: "Instagram", help: "Handle (e.g. @sunflourbakery) or full URL." },
  { key: "tiktok", label: "TikTok", help: "Handle (e.g. @sunflourbakery) or full URL." },
  { key: "facebook", label: "Facebook", help: "Handle or full URL." },
  { key: "address", label: "Physical address", help: "Shown on the contact page and linked to Google Maps." },
];

type Mode = "loading" | "view" | "edit";

function hasAnyValue(values: ContactValues): boolean {
  return Object.values(values).some((value) => (value ?? "").trim().length > 0);
}

export function ContactSettingsClient() {
  const [values, setValues] = useState<ContactValues>({});
  const [savedValues, setSavedValues] = useState<ContactValues>({});
  const [mode, setMode] = useState<Mode>("loading");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/admin/settings/contacts")
      .then((r) => r.json())
      .then((payload: { ok?: boolean; data?: { contacts: ContactValues | null } }) => {
        const loaded = (payload?.ok ? payload.data?.contacts : null) ?? {};
        setValues(loaded);
        setSavedValues(loaded);
        setMode(hasAnyValue(loaded) ? "view" : "edit");
      })
      .catch(() => setMode("edit"));
  }, []);

  function update(field: FieldKey, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const body: ContactValues = {};
      for (const { key } of FIELDS) {
        body[key] = (values[key] ?? "").trim() || null;
      }

      const response = await fetch("/api/v1/admin/settings/contacts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        data?: { contacts: ContactValues | null };
        error?: { message?: string };
      };

      if (payload?.ok) {
        const next = payload.data?.contacts ?? body;
        setValues(next);
        setSavedValues(next);
        setMode("view");
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

  function cancelEdit() {
    setValues(savedValues);
    setError(null);
    setMode("view");
  }

  if (mode === "loading") {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
        Loading contact settings…
      </div>
    );
  }

  if (mode === "view") {
    return (
      <div className="grid gap-4">
        {message ? (
          <p
            className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success)]"
            role="status"
          >
            {message}
          </p>
        ) : null}
        <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-xl font-bold">Contact details</h2>
            <Button
              icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                setMessage(null);
                setMode("edit");
              }}
              variant="secondary"
            >
              Edit
            </Button>
          </div>
          <dl className="m-0 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => {
              const value = (values[field.key] ?? "").trim();
              return (
                <div className="grid gap-1" key={field.key}>
                  <dt className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {field.label}
                  </dt>
                  <dd className="m-0 break-words text-sm font-medium">
                    {value ? (
                      value
                    ) : (
                      <span className="text-[var(--color-text-soft)]">Not set</span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="m-0 text-xl font-bold">Edit contact details</h2>
        {FIELDS.map((field) => (
          <Input
            key={field.key}
            helpText={field.help}
            label={field.label}
            onChange={(event) => update(field.key, event.target.value)}
            type={field.type}
            value={values[field.key] ?? ""}
          />
        ))}
      </section>

      {error ? (
        <p className="m-0 text-sm font-semibold text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {hasAnyValue(savedValues) ? (
          <Button
            icon={<X className="h-4 w-4" aria-hidden="true" />}
            onClick={cancelEdit}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
        ) : null}
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

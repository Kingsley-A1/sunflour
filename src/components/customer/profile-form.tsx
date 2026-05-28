"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CustomerProfileResponse } from "@/types/domain";

interface ProfileFormProps {
  profile: CustomerProfileResponse;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(
    profile.customerProfile?.fullName ?? profile.name ?? "",
  );
  const [phone, setPhone] = useState(profile.customerProfile?.phone ?? profile.phone ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveProfile() {
    setError(null);
    setMessage(null);

    if (fullName.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }

    if (phone.trim().length < 7) {
      setError("Enter your phone number.");
      return;
    }

    setIsSaving(true);

    try {
      await apiRequest("/api/v1/customer/profile", {
        method: "PATCH",
        body: JSON.stringify({
          fullName,
          phone,
        }),
      });
      setMessage("Profile saved.");
    } catch {
      setError("Profile could not be saved. Check the values and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div>
        <h2 className="m-0 text-xl font-bold">Saved details</h2>
        <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
          These details improve repeat ordering. Guest checkout remains
          available.
        </p>
      </div>
      {error ? <p className="m-0 text-sm font-semibold text-[var(--color-danger)]">{error}</p> : null}
      {message ? <p className="m-0 text-sm font-semibold text-[var(--color-success)]">{message}</p> : null}
      <Input label="Full name" onChange={(event) => setFullName(event.target.value)} value={fullName} />
      <Input label="Phone number" onChange={(event) => setPhone(event.target.value)} type="tel" value={phone} />
      <Button loading={isSaving} onClick={saveProfile}>
        Save profile
      </Button>
    </section>
  );
}

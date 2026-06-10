"use client";

import { useState } from "react";
import {
  getApiErrorMessage,
  getApiFieldError,
  updateCustomerProfile,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiClientError } from "@/types/api";
import type { CustomerProfileResponse } from "@/types/domain";

interface ProfileFormProps {
  profile: CustomerProfileResponse;
}

const phonePattern = /^\+?[0-9][0-9\s().-]{6,29}$/;

export function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(
    profile.customerProfile?.fullName ?? profile.name ?? "",
  );
  const [phone, setPhone] = useState(profile.customerProfile?.phone ?? profile.phone ?? "");
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    phone?: string;
  }>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveProfile() {
    setError(null);
    setMessage(null);
    setFieldErrors({});

    const nextFieldErrors: typeof fieldErrors = {};

    if (fullName.trim().length < 2) {
      nextFieldErrors.fullName = "Enter your full name.";
    }

    if (!phonePattern.test(phone.trim())) {
      nextFieldErrors.phone = "Enter a valid phone number.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError("Check the highlighted fields and try again.");
      return;
    }

    setIsSaving(true);

    try {
      await updateCustomerProfile({
        fullName,
        phone,
      });
      setMessage("Profile saved.");
    } catch (profileError) {
      if (profileError instanceof ApiClientError) {
        setFieldErrors({
          fullName: getApiFieldError(profileError.fieldErrors, "fullName"),
          phone: getApiFieldError(profileError.fieldErrors, "phone"),
        });
      }

      setError(
        getApiErrorMessage(
          profileError,
          "Profile could not be saved. Check the values and try again.",
        ),
      );
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
      <Input
        autoComplete="name"
        error={fieldErrors.fullName}
        label="Full name"
        onChange={(event) => setFullName(event.target.value)}
        value={fullName}
      />
      <Input
        autoComplete="tel"
        error={fieldErrors.phone}
        inputMode="tel"
        label="Phone number"
        onChange={(event) => setPhone(event.target.value)}
        type="tel"
        value={phone}
      />
      <Button loading={isSaving} onClick={saveProfile}>
        Save profile
      </Button>
    </section>
  );
}

"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { PasswordInput } from "@/components/ui/password-input";
import {
  confirmPasswordReset,
  getApiErrorMessage,
} from "@/lib/api/client";

interface ResetPasswordFormProps {
  initialEmail: string;
  initialToken: string;
}

export function ResetPasswordForm({
  initialEmail,
  initialToken,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const email = initialEmail.trim();
  const token = initialToken.trim();
  const isRecoveryLinkReady = email.length > 0 && token.length > 0;

  async function submitReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await confirmPasswordReset({
        email,
        token,
        password,
      });
      setMessage(result.message);
    } catch (resetError) {
      setError(
        getApiErrorMessage(resetError, "Password could not be updated."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isRecoveryLinkReady) {
    return (
      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <FormStatusMessage
          message="This reset link is incomplete or no longer usable. Request a new reset email to continue."
          tone="info"
        />
        <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
          Use the account recovery page to receive a fresh link for your Sunflour
          account.
        </p>
        <Link
          className="inline-flex min-h-[var(--control-height-md)] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          href="/forgot-password"
        >
          Request a new reset link
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {message ? (
        <FormStatusMessage message={message} tone="success" />
      ) : null}
      {error ? (
        <FormStatusMessage message={error} tone="danger" />
      ) : null}
      {message ? (
        <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
          Your password has been updated. Continue to sign in with the new password.
        </p>
      ) : (
        <form aria-busy={isSubmitting} className="grid gap-4" onSubmit={submitReset}>
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] px-3 py-2">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Resetting password for
            </p>
            <p className="m-0 mt-1 text-sm font-semibold text-[var(--color-text)]">
              {email}
            </p>
          </div>
          <PasswordInput
            autoComplete="new-password"
            disabled={isSubmitting}
            helpText="Use at least 8 characters with uppercase, lowercase, and a number."
            label="New password"
            onChange={(event) => setPassword(event.target.value)}
            required
            value={password}
          />
          <Button
            icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
            loading={isSubmitting}
            type="submit"
          >
            Save new password
          </Button>
        </form>
      )}
      <p className="m-0 text-sm text-[var(--color-text-muted)]">
        Back to{" "}
        <Link className="font-bold text-[var(--color-primary)]" href="/sign-in">
          sign in
        </Link>
        .
      </p>
    </section>
  );
}

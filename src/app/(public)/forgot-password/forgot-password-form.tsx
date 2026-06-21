"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { Input } from "@/components/ui/input";
import {
  getApiErrorMessage,
  requestPasswordReset,
} from "@/lib/api/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset({ email });
      setMessage(result.message);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Password reset request could not be sent.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {message ? (
        <FormStatusMessage message={message} tone="success" />
      ) : null}
      {error ? (
        <FormStatusMessage message={error} tone="danger" />
      ) : null}
      <form aria-busy={isSubmitting} className="grid gap-4" onSubmit={submitRequest}>
        <Input
          autoComplete="email"
          disabled={isSubmitting}
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <Button
          icon={<Mail className="h-4 w-4" aria-hidden="true" />}
          loading={isSubmitting}
          type="submit"
        >
          Send reset link
        </Button>
      </form>
    </section>
  );
}

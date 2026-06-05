"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      router.push("/sign-in" as Route);
    } catch (resetError) {
      setError(
        getApiErrorMessage(resetError, "Password could not be updated."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {message ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success)]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
      <form className="grid gap-4" onSubmit={submitReset}>
        <Input
          autoComplete="email"
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <Input
          label="Reset token"
          onChange={(event) => setToken(event.target.value)}
          required
          value={token}
        />
        <Input
          autoComplete="new-password"
          helpText="Use at least 8 characters with uppercase, lowercase, and a number."
          label="New password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <Button
          icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
          loading={isSubmitting}
          type="submit"
        >
          Update password
        </Button>
      </form>
    </section>
  );
}

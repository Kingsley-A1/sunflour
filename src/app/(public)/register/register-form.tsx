"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Globe2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  getApiFieldError,
  getApiErrorMessage,
  registerCustomerAccount,
} from "@/lib/api/client";
import { ApiClientError } from "@/types/api";

interface RegisterFormProps {
  callbackUrl: string;
  isGoogleAuthEnabled: boolean;
}

export function RegisterForm({
  callbackUrl,
  isGoogleAuthEnabled,
}: RegisterFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await registerCustomerAccount({ fullName, email, password });
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Account was created, but sign in failed. Sign in with your email and password.");
        return;
      }

      router.push((result?.url ?? callbackUrl) as Route);
      router.refresh();
    } catch (registrationError) {
      if (registrationError instanceof ApiClientError) {
        setFieldErrors({
          fullName: getApiFieldError(registrationError.fieldErrors, "fullName"),
          email: getApiFieldError(registrationError.fieldErrors, "email"),
          password: getApiFieldError(registrationError.fieldErrors, "password"),
        });
      }

      setError(
        getApiErrorMessage(
          registrationError,
          "Account could not be created. Check the form and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {error ? (
        <p
          className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {isGoogleAuthEnabled ? (
        <Button
          className="w-full"
          icon={<Globe2 className="h-4 w-4" aria-hidden="true" />}
          onClick={() => signIn("google", { callbackUrl })}
          size="lg"
          variant="secondary"
        >
          Continue with Google
        </Button>
      ) : null}
      {isGoogleAuthEnabled ? (
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          <span>Email account</span>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
      ) : null}
      <form className="grid gap-4" onSubmit={submitRegistration}>
        <Input
          autoComplete="name"
          error={fieldErrors.fullName}
          label="Full name"
          onChange={(event) => setFullName(event.target.value)}
          required
          value={fullName}
        />
        <Input
          autoComplete="email"
          error={fieldErrors.email}
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <PasswordInput
          autoComplete="new-password"
          error={fieldErrors.password}
          helpText="Use at least 8 characters with uppercase, lowercase, and a number."
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          required
          value={password}
        />
        <Button
          icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
          loading={isSubmitting}
          type="submit"
        >
          Create account
        </Button>
      </form>
      <p className="m-0 text-sm text-[var(--color-text-muted)]">
        Already have an account?{" "}
        <Link className="font-bold text-[var(--color-primary)]" href={"/sign-in" as Route}>
          Sign in
        </Link>
        .
      </p>
    </section>
  );
}

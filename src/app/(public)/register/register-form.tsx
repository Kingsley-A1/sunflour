"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getApiErrorMessage,
  registerCustomerAccount,
} from "@/lib/api/client";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await registerCustomerAccount({ fullName, email, password });
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/account",
        redirect: false,
      });
      router.push("/account" as Route);
      router.refresh();
    } catch (registrationError) {
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
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
      <form className="grid gap-4" onSubmit={submitRegistration}>
        <Input
          autoComplete="name"
          label="Full name"
          onChange={(event) => setFullName(event.target.value)}
          required
          value={fullName}
        />
        <Input
          autoComplete="email"
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <Input
          autoComplete="new-password"
          helpText="Use at least 8 characters with uppercase, lowercase, and a number."
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
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

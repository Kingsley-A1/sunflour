"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";
import { useState } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

interface SignInFormProps {
  callbackUrl: string;
  isGoogleAuthEnabled: boolean;
}

export function SignInForm({
  callbackUrl,
  isGoogleAuthEnabled,
}: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStartingGoogleSignIn, setIsStartingGoogleSignIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isBusy = isSigningIn || isStartingGoogleSignIn;

  async function submitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSigningIn(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Email or password is incorrect.");
        return;
      }

      router.push((result?.url ?? callbackUrl) as Route);
      router.refresh();
    } finally {
      setIsSigningIn(false);
    }
  }

  async function startGoogleSignIn() {
    setError(null);
    setIsStartingGoogleSignIn(true);

    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError(
        "Google sign-in is unavailable right now. Use your email and password or try again shortly.",
      );
    } finally {
      setIsStartingGoogleSignIn(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {error ? (
        <FormStatusMessage message={error} tone="danger" />
      ) : null}
      {isGoogleAuthEnabled ? (
        <GoogleAuthButton loading={isStartingGoogleSignIn} onClick={startGoogleSignIn} />
      ) : null}
      {isGoogleAuthEnabled ? (
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          <span>Email sign in</span>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
      ) : null}
      <form aria-busy={isBusy} className="grid gap-4" onSubmit={submitCredentials}>
        <Input
          autoComplete="email"
          disabled={isBusy}
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <PasswordInput
          autoComplete="current-password"
          disabled={isBusy}
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          required
          value={password}
        />
        <Button
          disabled={isStartingGoogleSignIn}
          icon={<Mail className="h-4 w-4" aria-hidden="true" />}
          loading={isSigningIn}
          type="submit"
        >
          Sign in
        </Button>
      </form>
      <p className="m-0 text-sm text-[var(--color-text-muted)]">
        Forgot password?{" "}
        <Link
          className="font-bold text-[var(--color-primary)]"
          href={"/forgot-password" as Route}
        >
          Reset it
        </Link>
        .
      </p>
      <p className="m-0 text-sm text-[var(--color-text-muted)]">
        New customer?{" "}
        <Link className="font-bold text-[var(--color-primary)]" href={"/register" as Route}>
          Create an account
        </Link>
        .
      </p>
    </section>
  );
}

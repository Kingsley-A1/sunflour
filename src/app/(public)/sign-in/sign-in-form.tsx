"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SignInFormProps {
  callbackUrl: string;
}

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

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

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {error ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
      <form className="grid gap-4" onSubmit={submitCredentials}>
        <Input
          autoComplete="email"
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <Input
          autoComplete="current-password"
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <Button
          icon={<LogIn className="h-4 w-4" aria-hidden="true" />}
          loading={isSigningIn}
          type="submit"
        >
          Sign in
        </Button>
      </form>
      <Button
        onClick={() => signIn("google", { callbackUrl })}
        variant="secondary"
      >
        Continue with Google
      </Button>
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

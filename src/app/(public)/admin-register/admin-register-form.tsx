"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { signIn } from "next-auth/react";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  getApiErrorMessage,
  registerAdminAccount,
} from "@/lib/api/client";
import type { UserRole } from "@/types/domain";

type AdminRegistrationRole = Exclude<UserRole, "CUSTOMER">;

const adminRoleOptions: Array<{
  value: AdminRegistrationRole;
  label: string;
}> = [
  { value: "SUPER_ADMIN", label: "Founder / super admin" },
  { value: "MODERATOR", label: "Manager / moderator" },
  { value: "ATTENDANT", label: "Supervisor / attendant" },
  { value: "MEDIA_MANAGER", label: "Media manager" },
];

export function AdminRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRegistrationRole>("ATTENDANT");
  const [registrationCode, setRegistrationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await registerAdminAccount({
        fullName,
        email,
        password,
        role,
        registrationCode,
      });
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/admin",
        redirect: false,
      });
      router.push("/admin" as Route);
      router.refresh();
    } catch (registrationError) {
      setError(
        getApiErrorMessage(
          registrationError,
          "Staff account could not be created. Check the role code and form values.",
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
        <Select
          label="Staff role"
          onChange={(event) =>
            setRole(event.target.value as AdminRegistrationRole)
          }
          value={role}
        >
          {adminRoleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          inputMode="numeric"
          label="6-digit role code"
          maxLength={6}
          onChange={(event) => setRegistrationCode(event.target.value)}
          pattern="[0-9]{6}"
          required
          value={registrationCode}
        />
        <Button
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          loading={isSubmitting}
          type="submit"
        >
          Register staff account
        </Button>
      </form>
    </section>
  );
}

import { ResetPasswordForm } from "./reset-password-form";

export const metadata = {
  title: "Set new password",
};

interface ResetPasswordPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const query = await searchParams;

  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Account recovery
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Set new password</h1>
        <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Choose a new password for your Sunflour account.
        </p>
      </header>
      <ResetPasswordForm
        initialEmail={first(query.email)}
        initialToken={first(query.token)}
      />
    </main>
  );
}

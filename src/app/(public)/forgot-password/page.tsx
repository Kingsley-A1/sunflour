import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Account recovery
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Reset password</h1>
        <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Enter your account email. If it exists, Sunflour will send a secure
          reset link.
        </p>
      </header>
      <ForgotPasswordForm />
    </main>
  );
}

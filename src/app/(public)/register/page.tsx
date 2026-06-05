import { RegisterForm } from "./register-form";

export const metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Customer account
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Create account</h1>
        <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Save your name for a warmer ordering experience. Guest checkout still
          remains available.
        </p>
      </header>
      <RegisterForm />
    </main>
  );
}

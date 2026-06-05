import { AdminRegisterForm } from "./admin-register-form";

export const metadata = {
  title: "Staff registration",
};

export default function AdminRegisterPage() {
  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Staff access
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Register admin account</h1>
        <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Staff registration requires the current 6-digit role code from the
          founder or operator.
        </p>
      </header>
      <AdminRegisterForm />
    </main>
  );
}

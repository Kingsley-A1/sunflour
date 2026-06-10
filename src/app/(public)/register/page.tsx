import { RegisterForm } from "./register-form";
import { resolveSafeAuthCallbackUrl } from "@/lib/auth/callback-url";
import { getGoogleProviderCredentials } from "@/server/auth/google-oauth";

export const metadata = {
  title: "Create account",
};

interface RegisterPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const query = await searchParams;
  const callbackUrl = resolveSafeAuthCallbackUrl(query.callbackUrl);
  const isGoogleAuthEnabled = Boolean(getGoogleProviderCredentials());

  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Customer account
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Create account</h1>
        <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Continue with Google, or create an account with your name, email, and
          password. Guest checkout still remains available.
        </p>
      </header>
      <RegisterForm
        callbackUrl={callbackUrl}
        isGoogleAuthEnabled={isGoogleAuthEnabled}
      />
    </main>
  );
}

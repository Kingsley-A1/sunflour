import { SignInForm } from "./sign-in-form";
import { resolveSafeAuthCallbackUrl } from "@/lib/auth/callback-url";
import { getGoogleProviderCredentials } from "@/server/auth/google-oauth";

export const metadata = {
  title: "Sign in",
};

interface SignInPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = await searchParams;
  const callbackUrl = resolveSafeAuthCallbackUrl(query.callbackUrl);
  const isGoogleAuthEnabled = Boolean(getGoogleProviderCredentials());

  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Sunflour account
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Sign in</h1>
        <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Continue with Google, or use your email and password.
        </p>
      </header>
      <SignInForm
        callbackUrl={callbackUrl}
        isGoogleAuthEnabled={isGoogleAuthEnabled}
      />
    </main>
  );
}

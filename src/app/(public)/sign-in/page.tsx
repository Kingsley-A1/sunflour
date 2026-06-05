import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in",
};

interface SignInPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = await searchParams;
  const callbackUrl = first(query.callbackUrl) ?? "/account";

  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Sunflour account
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Sign in</h1>
        <p className="m-0 mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Use your email and password, or continue with Google when OAuth is
          enabled.
        </p>
      </header>
      <SignInForm callbackUrl={callbackUrl} />
    </main>
  );
}

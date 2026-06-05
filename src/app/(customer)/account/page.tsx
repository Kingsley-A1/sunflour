import Link from "next/link";
import type { Route } from "next";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileForm } from "@/components/customer/profile-form";
import { requireAuth } from "@/server/auth/rbac";
import { getCustomerProfile } from "@/server/modules/customers";
import type { CustomerProfileResponse } from "@/types/domain";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return (
      <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
        <EmptyState
          action={
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
              href={"/sign-in?callbackUrl=/account" as Route}
            >
              Sign in
            </Link>
          }
          description="Sign in to reuse profile details and view authenticated order history. Guest checkout remains available."
          title="Account is optional"
        />
      </main>
    );
  }

  const profile = JSON.parse(
    JSON.stringify(await getCustomerProfile(user)),
  ) as CustomerProfileResponse;

  return (
    <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Account</p>
        <h1 className="m-0 mt-2 text-4xl font-extrabold">Your Sunflour profile</h1>
      </header>
      <Card className="grid gap-3 p-5">
        <h2 className="m-0 text-xl font-bold">Signed in details</h2>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="font-semibold">Name</dt>
            <dd className="m-0 text-[var(--color-text-muted)]">
              {profile.name ?? profile.customerProfile?.fullName ?? "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Email</dt>
            <dd className="m-0 text-[var(--color-text-muted)]">
              {profile.email ?? "Not provided"}
            </dd>
          </div>
        </dl>
      </Card>
      <ProfileForm profile={profile} />
      <Link
        className="inline-flex min-h-11 w-fit items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold"
        href="/account/orders"
      >
        View order history
      </Link>
    </main>
  );
}

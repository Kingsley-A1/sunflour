import { CheckoutPageClient } from "@/app/(public)/checkout/checkout-page-client";
import { getOptionalAuth } from "@/server/auth/rbac";
import { getCustomerProfile } from "@/server/modules/customers";
import type { CheckoutCustomerDefaults } from "@/app/(public)/checkout/checkout-page-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout",
};

async function getCheckoutCustomerDefaults(): Promise<CheckoutCustomerDefaults | null> {
  const user = await getOptionalAuth();

  if (!user) {
    return null;
  }

  try {
    const profile = await getCustomerProfile(user);

    return {
      fullName: profile.customerProfile?.fullName ?? profile.name ?? "",
      phone: profile.customerProfile?.phone ?? profile.phone ?? "",
      email: profile.email ?? "",
    };
  } catch {
    return null;
  }
}

export default async function CheckoutPage() {
  const customerDefaults = await getCheckoutCustomerDefaults();

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Checkout</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold sm:text-4xl">Create your order</h1>
      </header>
      <CheckoutPageClient customerDefaults={customerDefaults} />
    </main>
  );
}

import { CheckoutPageClient } from "@/app/(public)/checkout/checkout-page-client";

export const metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Checkout</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold sm:text-4xl">Create your order</h1>
        <p className="m-0 mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
          Guest checkout is available. Payment is manual bank transfer and stays
          pending until Sunflour verifies it.
        </p>
      </header>
      <CheckoutPageClient />
    </main>
  );
}

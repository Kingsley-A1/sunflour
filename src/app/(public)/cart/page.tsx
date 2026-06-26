import { CartPageClient } from "@/app/(public)/cart/cart-page-client";

export const metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Cart</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold sm:text-4xl">Review your order</h1>
      </header>
      <CartPageClient />
    </main>
  );
}

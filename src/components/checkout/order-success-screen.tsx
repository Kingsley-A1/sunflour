import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ArrowRight, CircleCheck, Home } from "lucide-react";

interface OrderSuccessScreenProps {
  title?: string;
  message?: string;
  children?: ReactNode;
}

/**
 * Friendly "order received" confirmation shown after checkout and as the
 * fallback when a customer returns to an order/invoice link that can no longer
 * be resolved — so they see reassurance and clear next steps instead of a bare
 * "not found" dead-end.
 */
export function OrderSuccessScreen({
  title = "Order received!",
  message = "Thank you! We're confirming your payment and packaging your order. You'll hear from us shortly.",
  children,
}: OrderSuccessScreenProps) {
  return (
    <section className="mx-auto grid max-w-xl justify-items-center gap-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-raised)] sm:p-8">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-success-soft)]">
        <CircleCheck
          className="h-9 w-9 text-[var(--color-success)]"
          aria-hidden="true"
        />
      </span>
      <div className="grid gap-2">
        <h1 className="m-0 text-3xl font-extrabold">{title}</h1>
        <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
          {message}
        </p>
      </div>
      {children}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          href={"/menu" as Route}
        >
          Browse menu
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
          href={"/" as Route}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
      </div>
    </section>
  );
}

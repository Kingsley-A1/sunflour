"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import type { UseFormSetError } from "react-hook-form";
import { z } from "zod";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";
import { OrderSummaryCard } from "@/components/checkout/order-summary-card";
import { PaymentInstructionCard } from "@/components/checkout/payment-instruction-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCheckoutOrder,
  getApiErrorMessage,
  getApiFieldError,
  getDeliveryZones,
  quoteDelivery,
} from "@/lib/api/client";
import { ApiClientError } from "@/types/api";
import { useCart } from "@/features/cart/cart-store";
import {
  buildCheckoutAttemptSignature,
  createCheckoutIdempotencyKey,
} from "@/lib/checkout/idempotency";
import type {
  CheckoutResult,
  DeliveryMethod,
  DeliveryQuote,
  DeliveryZone,
} from "@/types/domain";

const checkoutSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name."),
    phone: z.string().trim().min(7, "Enter your phone number."),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .optional()
      .or(z.literal("")),
    method: z.enum(["PICKUP", "DELIVERY"]),
    zoneId: z.string().optional(),
    address: z.string().optional(),
    customerNote: z.string().max(500, "Keep notes under 500 characters.").optional(),
  })
  .superRefine((value, context) => {
    if (value.method === "DELIVERY") {
      if (!value.zoneId) {
        context.addIssue({
          code: "custom",
          path: ["zoneId"],
          message: "Choose your delivery location.",
        });
      }

      if (!value.address || value.address.trim().length < 5) {
        context.addIssue({
          code: "custom",
          path: ["address"],
          message: "Enter the delivery address.",
        });
      }
    }
  });

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export interface CheckoutCustomerDefaults {
  fullName: string;
  phone: string;
  email: string;
}

function applyCheckoutFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  setFormError: UseFormSetError<CheckoutFormValues>,
): void {
  const mappings: Array<{
    field: keyof CheckoutFormValues;
    apiFields: string[];
  }> = [
    { field: "fullName", apiFields: ["customer.fullName", "fullName"] },
    { field: "phone", apiFields: ["customer.phone", "phone"] },
    { field: "email", apiFields: ["customer.email", "email"] },
    { field: "method", apiFields: ["delivery.method", "method"] },
    { field: "zoneId", apiFields: ["delivery.zoneId", "zoneId"] },
    { field: "address", apiFields: ["delivery.address", "address"] },
    { field: "customerNote", apiFields: ["customerNote"] },
  ];

  mappings.forEach(({ field, apiFields }) => {
    const message = getApiFieldError(fieldErrors, ...apiFields);

    if (message) {
      setFormError(field, {
        type: "server",
        message,
      });
    }
  });
}

interface CheckoutPageClientProps {
  customerDefaults?: CheckoutCustomerDefaults | null;
}

export function CheckoutPageClient({ customerDefaults }: CheckoutPageClientProps) {
  const cart = useCart();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      method: "PICKUP",
      fullName: customerDefaults?.fullName ?? "",
      phone: customerDefaults?.phone ?? "",
      email: customerDefaults?.email ?? "",
      zoneId: "",
      address: "",
      customerNote: "",
    },
  });

  const method = useWatch({ control, name: "method" });
  const zoneId = useWatch({ control, name: "zoneId" });
  const methodField = register("method");
  const zoneIdField = register("zoneId");
  const activeQuote = method === "DELIVERY" && !zoneId ? null : quote;
  const requiresDeliveryQuote = method === "DELIVERY";
  const deliveryQuoteBlocking =
    requiresDeliveryQuote && (!zoneId || isQuoteLoading || !activeQuote);
  const disableSubmitForQuote =
    requiresDeliveryQuote && Boolean(zoneId) && isQuoteLoading;

  const currentStep = result ? 4 : method === "DELIVERY" ? 2 : 1;

  useEffect(() => {
    getDeliveryZones()
      .then(setZones)
      .catch(() =>
        setQuoteError(
          "Delivery zones could not be loaded. You can still choose pickup.",
        ),
      );
  }, []);

  useEffect(() => {
    const deliveryMethod = method as DeliveryMethod;

    if (deliveryMethod === "DELIVERY" && !zoneId) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setQuote(null);
        setQuoteError(null);
        setIsQuoteLoading(true);
      }
    });

    quoteDelivery({
      deliveryMethod,
      deliveryZoneId: deliveryMethod === "DELIVERY" ? zoneId : undefined,
    })
      .then((nextQuote) => {
        if (!cancelled) {
          setQuote(nextQuote);
        }
      })
      .catch((quoteRequestError) => {
        if (!cancelled) {
          setQuoteError(
            getApiErrorMessage(
              quoteRequestError,
              "Delivery quote failed. Check your delivery choice.",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsQuoteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [method, zoneId]);

  const checkoutItems = useMemo(
    () =>
      cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    [cart.items],
  );

  const cartAttemptSignature = useMemo(
    () => buildCheckoutAttemptSignature(checkoutItems),
    [checkoutItems],
  );

  const idempotencyKey = useMemo(
    () => {
      void cartAttemptSignature;
      return createCheckoutIdempotencyKey();
    },
    [cartAttemptSignature],
  );

  const fieldErrorSummary = [
    { href: "#fullName", message: errors.fullName?.message },
    { href: "#phone", message: errors.phone?.message },
    { href: "#email", message: errors.email?.message },
    { href: "#method", message: errors.method?.message },
    { href: "#zoneId", message: errors.zoneId?.message },
    { href: "#address", message: errors.address?.message },
    { href: "#customerNote", message: errors.customerNote?.message },
  ].filter((item): item is { href: string; message: string } =>
    Boolean(item.message),
  );

  async function onSubmit(values: CheckoutFormValues) {
    setSubmitError(null);

    if (cart.items.length === 0) {
      setSubmitError("Add at least one item before checkout.");
      return;
    }

    if (values.method === "DELIVERY" && deliveryQuoteBlocking) {
      setSubmitError("Choose a delivery zone and wait for the delivery quote.");
      return;
    }

    try {
      const checkoutResult = await createCheckoutOrder(
        {
          customer: {
            fullName: values.fullName,
            phone: values.phone,
            email: values.email || undefined,
          },
          delivery: {
            method: values.method,
            zoneId: values.method === "DELIVERY" ? values.zoneId : undefined,
            address:
              values.method === "DELIVERY" ? values.address?.trim() : undefined,
          },
          items: checkoutItems,
          customerNote: values.customerNote?.trim() || undefined,
        },
        idempotencyKey,
      );

      setResult(checkoutResult);
      cart.clearCart();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyCheckoutFieldErrors(error.fieldErrors, setFormError);
        setSubmitError(getApiErrorMessage(error, error.message));
        return;
      }

      setSubmitError("Checkout failed. Review your details and try again.");
    }
  }

  if (result) {
    return (
      <div className="grid gap-5">
        <CheckoutStepper currentStep={4} />
        <PaymentInstructionCard result={result} />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        action={
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
            href="/menu"
          >
            Browse menu
          </Link>
        }
        description="Checkout stays open to guests, but it needs at least one cart item."
        title="No items to checkout"
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
        <CheckoutStepper currentStep={currentStep} />
        {submitError ? (
          <ErrorState description={submitError} title="Checkout could not continue" />
        ) : null}
        {fieldErrorSummary.length > 0 ? (
          <section
            aria-labelledby="checkout-error-summary-title"
            className="grid gap-2 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm"
            role="alert"
          >
            <h2
              className="m-0 text-base font-bold text-[var(--color-danger)]"
              id="checkout-error-summary-title"
            >
              Fix these checkout details
            </h2>
            <ul className="m-0 grid gap-1 pl-5 text-[var(--color-danger)]">
              {fieldErrorSummary.map((item) => (
                <li key={item.href}>
                  <a className="font-semibold underline" href={item.href}>
                    {item.message}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div>
            <h2 className="m-0 text-xl font-bold">Customer details</h2>
            <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
              Email is optional. Phone number is required for order follow-up.
            </p>
          </div>
          <Input
            autoComplete="name"
            error={errors.fullName?.message}
            label="Full name"
            {...register("fullName")}
          />
          <Input
            autoComplete="tel"
            error={errors.phone?.message}
            label="Phone number"
            type="tel"
            {...register("phone")}
          />
          <Input
            autoComplete="email"
            error={errors.email?.message}
            helpText="Optional. Used for order emails when available."
            label="Email"
            type="email"
            {...register("email")}
          />
        </section>

        <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div>
            <h2 className="m-0 text-xl font-bold">Pickup or delivery</h2>
            <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
              Delivery fees are quoted by the backend and recalculated when the
              order is created.
            </p>
          </div>
          <fieldset className="grid gap-2" id="method">
            <legend className="sr-only">Choose pickup or delivery</legend>
            {(["PICKUP", "DELIVERY"] as const).map((option) => (
              <label
                className="flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3"
                key={option}
              >
                <input
                  type="radio"
                  value={option}
                  {...methodField}
                  onChange={(event) => {
                    void methodField.onChange(event);
                    setQuote(null);
                    setQuoteError(null);
                  }}
                />
                <span className="font-semibold">
                  {option === "PICKUP" ? "Pickup" : "Delivery"}
                </span>
              </label>
            ))}
          </fieldset>
          {method === "DELIVERY" ? (
            <>
              <Select
                error={errors.zoneId?.message}
                label="Delivery zone"
                {...zoneIdField}
                onChange={(event) => {
                  void zoneIdField.onChange(event);
                  setQuote(null);
                  setQuoteError(null);
                }}
              >
                <option value="">Choose a zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </Select>
              <Textarea
                error={errors.address?.message}
                label="Delivery address"
                {...register("address")}
              />
            </>
          ) : null}
          <Textarea
            error={errors.customerNote?.message}
            helpText="Optional note for the kitchen or delivery handoff."
            label="Customer note"
            {...register("customerNote")}
          />
          {isQuoteLoading ? (
            <p className="m-0 text-sm font-semibold text-[var(--color-text-muted)]">
              Getting the backend delivery quote...
            </p>
          ) : null}
          {quoteError ? <ErrorState description={quoteError} title="Quote issue" /> : null}
        </section>

        <Button
          disabled={disableSubmitForQuote}
          loading={isSubmitting}
          size="lg"
          type="submit"
        >
          Create order
        </Button>
      </form>
      <aside className="grid gap-4">
        <OrderSummaryCard
          items={cart.items}
          quote={activeQuote}
          subtotal={cart.displaySubtotal}
        />
      </aside>
    </div>
  );
}

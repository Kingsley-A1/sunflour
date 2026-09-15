"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { getApiErrorMessage, updateAdminOrderPaymentStatus } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { canMarkOrderPaymentSuccessful } from "@/lib/status";
import type { OrderStatus, PaymentStatus, UserRole } from "@/types/domain";

interface MarkOrderPaidButtonProps {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  role: UserRole;
}

/**
 * Quick "mark as paid" action for the admin orders list, so confirming a
 * bank transfer doesn't require opening every order's detail page first.
 * Wraps the same backend transition (and the same client-side permission
 * check) as the full "Mark payment as successful" action there.
 */
export function MarkOrderPaidButton({
  orderNumber,
  status,
  paymentStatus,
  role,
}: MarkOrderPaidButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canMarkOrderPaymentSuccessful(role, paymentStatus, status)) {
    return null;
  }

  async function markPaid() {
    setIsSaving(true);
    setError(null);

    try {
      await updateAdminOrderPaymentStatus({
        orderNumber,
        paymentStatus: "CONFIRMED",
        reason: "Marked paid from order list.",
      });
      setConfirmOpen(false);
      router.refresh();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, "Payment status update failed."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button
        icon={<CircleCheck className="h-4 w-4" aria-hidden="true" />}
        onClick={() => setConfirmOpen(true)}
        size="sm"
        variant="secondary"
      >
        Mark as paid
      </Button>
      <ConfirmDialog
        confirmLabel="Mark as paid"
        description={`This confirms the transfer for ${orderNumber} was received and moves it to Payment confirmed.`}
        loading={isSaving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={markPaid}
        open={confirmOpen}
        title="Confirm payment received"
      >
        {error ? (
          <p className="m-0 text-sm font-semibold text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OrderStatus, PaymentStatus } from "@/types/domain";

interface OrderActionsClientProps {
  orderNumber: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
  adminNote: string | null;
}

const transitionMap: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAYMENT_UNDER_REVIEW", "CANCELLED", "REJECTED"],
  PAYMENT_UNDER_REVIEW: ["PAYMENT_CONFIRMED", "CANCELLED", "REJECTED"],
  PAYMENT_CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_PICKUP: ["DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

const paymentOptions: PaymentStatus[] = [
  "PROOF_SENT_ON_WHATSAPP",
  "UNDER_REVIEW",
  "CONFIRMED",
  "REJECTED",
];

export function OrderActionsClient({
  orderNumber,
  currentStatus,
  currentPaymentStatus,
  adminNote,
}: OrderActionsClientProps) {
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [nextPaymentStatus, setNextPaymentStatus] = useState<PaymentStatus | "">("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState(adminNote ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function updateOrderStatus() {
    if (!nextStatus) {
      setError("Choose a status.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      await apiRequest(`/api/v1/admin/orders/${orderNumber}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          reason: reason || undefined,
          adminNote: note || undefined,
        }),
      });
      setMessage("Order status updated. Refresh to see the latest timeline.");
      setConfirmOpen(false);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Order status update failed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updatePaymentStatus() {
    if (!nextPaymentStatus) {
      setError("Choose a payment status.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      await apiRequest(`/api/v1/admin/orders/${orderNumber}/payment-status`, {
        method: "PATCH",
        body: JSON.stringify({
          paymentStatus: nextPaymentStatus,
          reason: reason || undefined,
        }),
      });
      setMessage("Payment status updated. Refresh to see the latest order state.");
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Payment status update failed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveNote() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      await apiRequest(`/api/v1/admin/orders/${orderNumber}/notes`, {
        method: "PATCH",
        body: JSON.stringify({
          adminNote: note || null,
        }),
      });
      setMessage("Admin note saved.");
    } catch {
      setError("Admin note could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div>
        <h2 className="m-0 text-xl font-bold">Admin actions</h2>
        <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
          Backend validates transitions and writes status events/audit logs.
        </p>
      </div>
      {error ? <p className="m-0 text-sm font-semibold text-[var(--color-danger)]">{error}</p> : null}
      {message ? <p className="m-0 text-sm font-semibold text-[var(--color-success)]">{message}</p> : null}
      <Select
        label="Next order status"
        onChange={(event) => setNextStatus(event.target.value as OrderStatus | "")}
        value={nextStatus}
      >
        <option value="">Choose status</option>
        {transitionMap[currentStatus].map((status) => (
          <option key={status} value={status}>
            {status.replaceAll("_", " ")}
          </option>
        ))}
      </Select>
      <Select
        label="Next payment status"
        onChange={(event) =>
          setNextPaymentStatus(event.target.value as PaymentStatus | "")
        }
        value={nextPaymentStatus}
      >
        <option value="">Choose payment status</option>
        {paymentOptions
          .filter((status) => status !== currentPaymentStatus)
          .map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
      </Select>
      <Textarea
        helpText="Required by the backend for cancellation, rejection, and rejected payment."
        label="Reason"
        onChange={(event) => setReason(event.target.value)}
        value={reason}
      />
      <Textarea
        label="Admin note"
        onChange={(event) => setNote(event.target.value)}
        value={note}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          disabled={!nextStatus}
          loading={isSaving}
          onClick={() => setConfirmOpen(true)}
          variant="secondary"
        >
          Update order status
        </Button>
        <Button
          disabled={!nextPaymentStatus}
          loading={isSaving}
          onClick={updatePaymentStatus}
          variant="secondary"
        >
          Update payment
        </Button>
        <Button loading={isSaving} onClick={saveNote} variant="secondary">
          Save note
        </Button>
      </div>
      <ConfirmDialog
        confirmLabel="Update status"
        description="This status change will be validated by the backend and recorded in the order timeline."
        loading={isSaving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={updateOrderStatus}
        open={confirmOpen}
        title="Confirm order status update"
      />
    </section>
  );
}

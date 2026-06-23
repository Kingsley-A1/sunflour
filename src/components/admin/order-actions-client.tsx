"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getApiErrorMessage,
  updateAdminOrderNote,
  updateAdminOrderPaymentStatus,
  updateAdminOrderStatus,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  DeliveryMethod,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from "@/types/domain";

interface OrderActionsClientProps {
  orderNumber: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
  deliveryMethod: DeliveryMethod;
  adminNote: string | null;
  role: UserRole;
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

function getAllowedTransitions(
  currentStatus: OrderStatus,
  deliveryMethod: DeliveryMethod,
): OrderStatus[] {
  return transitionMap[currentStatus].filter((status) => {
    if (deliveryMethod === "PICKUP") {
      return status !== "OUT_FOR_DELIVERY";
    }

    if (deliveryMethod === "DELIVERY") {
      return status !== "READY_FOR_PICKUP";
    }

    return true;
  });
}

export function OrderActionsClient({
  orderNumber,
  currentStatus,
  currentPaymentStatus,
  deliveryMethod,
  adminNote,
  role,
}: OrderActionsClientProps) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [nextPaymentStatus, setNextPaymentStatus] = useState<PaymentStatus | "">("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState(adminNote ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const allowedTransitions = getAllowedTransitions(currentStatus, deliveryMethod);
  const nextStatusIsDestructive =
    nextStatus === "CANCELLED" || nextStatus === "REJECTED";
  const nextPaymentStatusIsDestructive = nextPaymentStatus === "REJECTED";
  const allowedPaymentOptions =
    role === "ATTENDANT"
      ? (["PROOF_SENT_ON_WHATSAPP", "UNDER_REVIEW"] satisfies PaymentStatus[])
      : paymentOptions;

  async function updateOrderStatus() {
    if (!nextStatus) {
      setError("Choose a status.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updateAdminOrderStatus({
        orderNumber,
        status: nextStatus,
        reason: reason || undefined,
        adminNote: note || undefined,
      });
      setMessage("Order status updated and recorded in the timeline.");
      setConfirmOpen(false);
      setNextStatus("");
      router.refresh();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, "Order status update failed."));
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
      await updateAdminOrderPaymentStatus({
        orderNumber,
        paymentStatus: nextPaymentStatus,
        reason: reason || undefined,
      });
      setMessage("Payment status updated and recorded for audit.");
      setPaymentConfirmOpen(false);
      setNextPaymentStatus("");
      router.refresh();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, "Payment status update failed."));
    } finally {
      setIsSaving(false);
    }
  }

  async function saveNote() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updateAdminOrderNote({
        orderNumber,
        adminNote: note || null,
      });
      setMessage("Admin note saved.");
      router.refresh();
    } catch (noteError) {
      setError(getApiErrorMessage(noteError, "Admin note could not be saved."));
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
          This is a {deliveryMethod.toLowerCase()} order, so unavailable
          fulfillment statuses are not offered here.
        </p>
      </div>
      {error ? <p className="m-0 text-sm font-semibold text-[var(--color-danger)]" role="alert">{error}</p> : null}
      {message ? <p className="m-0 text-sm font-semibold text-[var(--color-success)]" role="status">{message}</p> : null}
      <Select
        label="Next order status"
        onChange={(event) => setNextStatus(event.target.value as OrderStatus | "")}
        value={nextStatus}
      >
        <option value="">Choose status</option>
        {allowedTransitions.map((status) => (
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
        {allowedPaymentOptions
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
          onClick={() => setPaymentConfirmOpen(true)}
          variant="secondary"
        >
          Update payment
        </Button>
        <Button loading={isSaving} onClick={saveNote} variant="secondary">
          Save note
        </Button>
      </div>
      <ConfirmDialog
        confirmLabel={nextStatusIsDestructive ? "Confirm protected change" : "Update status"}
        description={
          nextStatusIsDestructive
            ? "This closes or rejects the order. Enter a clear reason before confirming; the backend records the event and audit log."
            : "This status change will be validated by the backend and recorded in the order timeline."
        }
        destructive={nextStatusIsDestructive}
        loading={isSaving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={updateOrderStatus}
        open={confirmOpen}
        title="Confirm order status update"
      />
      <ConfirmDialog
        confirmLabel={
          nextPaymentStatus === "REJECTED" ? "Reject payment" : "Update payment"
        }
        destructive={nextPaymentStatusIsDestructive}
        description={
          nextPaymentStatus === "REJECTED"
            ? "Rejected payment closes this order as rejected. Enter a clear reason before confirming."
            : "This payment change will be validated by the backend and recorded for audit."
        }
        loading={isSaving}
        onCancel={() => setPaymentConfirmOpen(false)}
        onConfirm={updatePaymentStatus}
        open={paymentConfirmOpen}
        title="Confirm payment status update"
      />
    </section>
  );
}

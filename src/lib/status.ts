import type {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  ReviewStatus,
} from "@/types/domain";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
  helper: string;
}

export const orderStatusMeta: Record<OrderStatus, StatusMeta> = {
  PENDING_PAYMENT: {
    label: "Pending payment",
    tone: "warning",
    helper: "Waiting for transfer proof or admin review.",
  },
  PAYMENT_UNDER_REVIEW: {
    label: "Payment under review",
    tone: "info",
    helper: "Staff is checking the transfer proof.",
  },
  PAYMENT_CONFIRMED: {
    label: "Payment confirmed",
    tone: "success",
    helper: "Payment has been verified by staff.",
  },
  PREPARING: {
    label: "Preparing",
    tone: "info",
    helper: "The order is being prepared.",
  },
  READY_FOR_PICKUP: {
    label: "Ready for pickup",
    tone: "success",
    helper: "The order is ready for the customer.",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for delivery",
    tone: "info",
    helper: "The order is on the way.",
  },
  DELIVERED: {
    label: "Delivered",
    tone: "success",
    helper: "The order is complete.",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "danger",
    helper: "The order was cancelled.",
  },
  REJECTED: {
    label: "Rejected",
    tone: "danger",
    helper: "The order cannot proceed.",
  },
};

export const paymentStatusMeta: Record<PaymentStatus, StatusMeta> = {
  UNPAID: {
    label: "Unpaid",
    tone: "warning",
    helper: "Payment has not been confirmed.",
  },
  PROOF_SENT_ON_WHATSAPP: {
    label: "Proof sent",
    tone: "info",
    helper: "Proof is expected on WhatsApp.",
  },
  UNDER_REVIEW: {
    label: "Under review",
    tone: "info",
    helper: "Staff is verifying the transfer.",
  },
  CONFIRMED: {
    label: "Confirmed",
    tone: "success",
    helper: "Payment has been manually confirmed.",
  },
  REJECTED: {
    label: "Rejected",
    tone: "danger",
    helper: "Payment proof was rejected.",
  },
};

export const productStatusMeta: Record<ProductStatus, StatusMeta> = {
  ACTIVE: {
    label: "Active",
    tone: "success",
    helper: "Visible and orderable.",
  },
  HIDDEN: {
    label: "Hidden",
    tone: "neutral",
    helper: "Not visible on the public menu.",
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    tone: "warning",
    helper: "Visible only if the backend allows it; not orderable.",
  },
};

export const reviewStatusMeta: Record<ReviewStatus, StatusMeta> = {
  PENDING: {
    label: "Pending",
    tone: "warning",
    helper: "Waiting for moderation.",
  },
  APPROVED: {
    label: "Approved",
    tone: "success",
    helper: "Publicly visible.",
  },
  REJECTED: {
    label: "Rejected",
    tone: "danger",
    helper: "Not publicly visible.",
  },
  HIDDEN: {
    label: "Hidden",
    tone: "neutral",
    helper: "Not publicly visible.",
  },
};

export function getStatusMeta(status: string): StatusMeta {
  return (
    orderStatusMeta[status as OrderStatus] ??
    paymentStatusMeta[status as PaymentStatus] ??
    productStatusMeta[status as ProductStatus] ??
    reviewStatusMeta[status as ReviewStatus] ?? {
      label: status
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (letter) => letter.toUpperCase()),
      tone: "neutral",
      helper: "Status returned by the backend.",
    }
  );
}

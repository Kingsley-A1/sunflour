import { formatNairaFromKobo } from "@/server/lib/money/money";

export interface PaymentInstructionSource {
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentInstruction: string;
}

export interface WhatsAppProofMessageItem {
  productName: string;
  variantName?: string | null;
  quantity: number;
  lineTotal: number;
}

export interface WhatsAppProofMessageDelivery {
  method: "DELIVERY" | "PICKUP";
  zoneName?: string | null;
  address?: string | null;
  // When the order was placed, used to give pickup staff a clear time
  // reference since pickup orders have no delivery zone/address to show.
  orderPlacedAt: Date;
}

export interface WhatsAppProofMessageInput {
  orderNumber: string;
  customerName: string;
  // The amount actually sent by bank transfer (the product subtotal). Delivery
  // fees are collected by the delivery person on delivery, not by transfer.
  amountPaid: number;
  items?: WhatsAppProofMessageItem[];
  delivery?: WhatsAppProofMessageDelivery;
  customerNote?: string | null;
}

export function buildPaymentInstructionSnapshot({
  bankName,
  accountName,
  accountNumber,
  paymentInstruction,
}: PaymentInstructionSource): string {
  return [
    `Bank Name: ${bankName}`,
    `Account Name: ${accountName}`,
    `Account Number: ${accountNumber}`,
    "",
    paymentInstruction,
  ].join("\n");
}

function formatItemLine(item: WhatsAppProofMessageItem): string {
  const name = item.variantName
    ? `${item.productName} (${item.variantName})`
    : item.productName;

  return `- ${name} x${item.quantity} — ${formatNairaFromKobo(item.lineTotal)}`;
}

function formatOrderPlacedAt(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function formatFulfillmentLine(delivery: WhatsAppProofMessageDelivery): string {
  if (delivery.method === "PICKUP") {
    return `Fulfillment: Pickup (ordered ${formatOrderPlacedAt(delivery.orderPlacedAt)})`;
  }

  const destination = [delivery.zoneName, delivery.address]
    .filter((value): value is string => Boolean(value))
    .join(" — ");

  return `Fulfillment: Delivery${destination ? ` to ${destination}` : ""}`;
}

export function buildWhatsAppProofMessage({
  orderNumber,
  customerName,
  amountPaid,
  items,
  delivery,
  customerNote,
}: WhatsAppProofMessageInput): string {
  const itemLines =
    items && items.length > 0
      ? ["Items:", ...items.map(formatItemLine), ""]
      : [];

  const deliveryLines = delivery
    ? [
        formatFulfillmentLine(delivery),
        ...(customerNote ? [`Note: ${customerNote}`] : []),
        "",
      ]
    : [];

  return [
    "Hello Sunflour Bakery, I have made payment for my order.",
    "",
    `Order Number: ${orderNumber}`,
    `Customer Name: ${customerName}`,
    ...itemLines,
    ...deliveryLines,
    `Amount Paid: ${formatNairaFromKobo(amountPaid)}`,
    "",
    "I am sending my payment proof now.",
  ].join("\n");
}

export function buildWhatsAppProofUrl(
  message: string,
  phoneNumber?: string | null,
): string {
  const digits = phoneNumber?.replace(/\D/g, "");
  const baseUrl = digits ? `https://wa.me/${digits}` : "https://wa.me/";

  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

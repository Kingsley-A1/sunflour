import { formatNairaFromKobo } from "@/server/lib/money/money";

export interface PaymentInstructionSource {
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentInstruction: string;
}

export interface WhatsAppProofMessageInput {
  orderNumber: string;
  customerName: string;
  // The amount actually sent by bank transfer (the product subtotal). Delivery
  // fees are collected by the delivery person on delivery, not by transfer.
  amountPaid: number;
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

export function buildWhatsAppProofMessage({
  orderNumber,
  customerName,
  amountPaid,
}: WhatsAppProofMessageInput): string {
  return [
    "Hello Sunflour Bakery, I have made payment for my order.",
    "",
    `Order Number: ${orderNumber}`,
    `Customer Name: ${customerName}`,
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

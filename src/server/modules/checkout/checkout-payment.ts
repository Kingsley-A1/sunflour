import { getServerEnv } from "@/server/config/env";
import { formatNairaFromKobo } from "@/server/lib/money/money";

const FALLBACK_PAYMENT_INSTRUCTION =
  "Payment instructions are not configured yet. Contact Sunflour Bakery before making payment.";

export interface WhatsAppProofMessageInput {
  orderNumber: string;
  customerName: string;
  total: number;
}

export function getCheckoutPaymentInstruction(): string {
  return (
    getServerEnv().SUNFLOUR_PAYMENT_INSTRUCTION ?? FALLBACK_PAYMENT_INSTRUCTION
  );
}

export function buildWhatsAppProofMessage({
  orderNumber,
  customerName,
  total,
}: WhatsAppProofMessageInput): string {
  return [
    "Hello Sunflour Bakery, I have made payment for my order.",
    "",
    `Order Number: ${orderNumber}`,
    `Customer Name: ${customerName}`,
    `Total Amount: ${formatNairaFromKobo(total)}`,
    "",
    "I am sending my payment proof now.",
  ].join("\n");
}

export function buildWhatsAppProofUrl(
  message: string,
  phoneNumber?: string,
): string {
  const digits = phoneNumber?.replace(/\D/g, "");
  const baseUrl = digits ? `https://wa.me/${digits}` : "https://wa.me/";

  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

export function getCheckoutWhatsAppProofUrl(message: string): string {
  return buildWhatsAppProofUrl(
    message,
    getServerEnv().SUNFLOUR_PROOF_WHATSAPP_NUMBER,
  );
}

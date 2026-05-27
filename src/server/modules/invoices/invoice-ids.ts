import { randomBytes } from "node:crypto";

export function generateInvoiceNumber(orderNumber: string): string {
  return `INV-${orderNumber}`;
}

export function generateInvoiceAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

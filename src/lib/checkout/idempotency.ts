export interface CheckoutAttemptItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export function createCheckoutIdempotencyKey(
  createId = () => crypto.randomUUID(),
): string {
  return `checkout_${createId()}`;
}

export function buildCheckoutAttemptSignature(
  items: CheckoutAttemptItem[],
): string {
  return items
    .map((item) => `${item.productId}:${item.variantId ?? "base"}:${item.quantity}`)
    .join("|");
}

import { createHash, randomInt } from "node:crypto";
import type { CheckoutCreateInput } from "./checkout-schemas";

const ORDER_NUMBER_PREFIX = "SFB";
const ORDER_NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomOrderCode(length = 6): string {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += ORDER_NUMBER_ALPHABET[randomInt(ORDER_NUMBER_ALPHABET.length)];
  }

  return code;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, stableValue(entryValue)]),
    );
  }

  return value;
}

export function generateOrderNumber(now = new Date()): string {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");

  return `${ORDER_NUMBER_PREFIX}-${datePart}-${randomOrderCode()}`;
}

export function buildIdempotencyRequestHash(
  input: CheckoutCreateInput,
): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(input)))
    .digest("hex");
}

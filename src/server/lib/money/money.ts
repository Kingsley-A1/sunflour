export const CURRENCY_CODE = "NGN" as const;
export const KOBO_PER_NAIRA = 100;

export type CurrencyCode = typeof CURRENCY_CODE;

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export function assertKoboAmount(amount: number): number {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new RangeError("Money amount must be a non-negative safe integer.");
  }

  return amount;
}

export function nairaToKobo(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("Naira amount must be a non-negative finite number.");
  }

  return assertKoboAmount(Math.round(amount * KOBO_PER_NAIRA));
}

export function makeMoney(amount: number): Money {
  return {
    amount: assertKoboAmount(amount),
    currency: CURRENCY_CODE,
  };
}

export function addKobo(...amounts: number[]): number {
  return assertKoboAmount(
    amounts.reduce((total, amount) => total + assertKoboAmount(amount), 0),
  );
}

export function multiplyKobo(unitAmount: number, quantity: number): number {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError("Quantity must be a positive safe integer.");
  }

  return assertKoboAmount(assertKoboAmount(unitAmount) * quantity);
}

export function formatNairaFromKobo(amount: number): string {
  const kobo = assertKoboAmount(amount);
  const naira = kobo / KOBO_PER_NAIRA;

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: CURRENCY_CODE,
    maximumFractionDigits: kobo % KOBO_PER_NAIRA === 0 ? 0 : 2,
  }).format(naira);
}

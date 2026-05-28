const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

export function formatNairaFromKobo(amount: number): string {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    return nairaFormatter.format(0);
  }

  return nairaFormatter.format(amount / 100);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return dateFormatter.format(date);
}

export function nairaInputToKobo(value: string): number {
  const normalized = value.replace(/[^\d.]/g, "");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

export function koboToNairaInput(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    return "";
  }

  return String(value / 100);
}

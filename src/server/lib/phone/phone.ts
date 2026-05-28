export function normalizePhoneForStorage(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function normalizePhoneForComparison(phone: string): string {
  return phone.replace(/\D/g, "");
}

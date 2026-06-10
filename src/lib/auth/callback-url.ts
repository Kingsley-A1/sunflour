export function resolveSafeAuthCallbackUrl(
  value: string | string[] | undefined,
  fallback = "/account",
): string {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return fallback;
  }

  if (!rawValue.startsWith("/") || rawValue.startsWith("//")) {
    return fallback;
  }

  return rawValue;
}

export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function containsHtmlMarkup(value: string): boolean {
  return /<[^>]*>/.test(value);
}

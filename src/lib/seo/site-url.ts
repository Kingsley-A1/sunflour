// Falls back to the live production domain (not localhost) so canonical
// links, sitemap/robots URLs, and Open Graph/Twitter image URLs still resolve
// to a real, publicly fetchable address if NEXT_PUBLIC_APP_URL is ever unset
// at build time. Crawlers like WhatsApp's cannot follow a localhost URL.
const DEFAULT_SITE_URL = "https://sunflourbakery.ng";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL).replace(
    /\/$/,
    "",
  );
}

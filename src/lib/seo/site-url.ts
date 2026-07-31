// Falls back to the live production domain (not localhost) so canonical
// links, sitemap/robots URLs, and Open Graph/Twitter image URLs still resolve
// to a real, publicly fetchable address if NEXT_PUBLIC_APP_URL is ever unset
// at build time. Crawlers like WhatsApp's cannot follow a localhost URL.
const DEFAULT_SITE_URL = "https://www.sunflourbakery.ng";

export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl);

      // Production currently inherits a Vercel project URL. Social crawlers
      // should always receive the public Sunflour hostname, otherwise shared
      // custom-domain links advertise an image on a different deployment host.
      if (!url.hostname.endsWith(".vercel.app")) {
        return url.toString().replace(/\/$/, "");
      }
    } catch {
      // Environment validation owns malformed URLs; metadata remains usable.
    }
  }

  return DEFAULT_SITE_URL;
}

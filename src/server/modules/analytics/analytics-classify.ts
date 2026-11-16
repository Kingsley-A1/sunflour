/**
 * Pure helpers that turn raw browser signals into the plain categories an
 * owner understands. They run at ingest time so stored rows are already
 * readable ("whatsapp", "mobile") and reports need no parsing.
 */

export type TrafficSource =
  | "direct"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "x"
  | "google"
  | "bing"
  | "other_search"
  | "other_site"
  | "campaign";

export const TRAFFIC_SOURCE_LABELS: Record<TrafficSource, string> = {
  direct: "Direct / typed link",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X (Twitter)",
  google: "Google",
  bing: "Bing",
  other_search: "Other search engines",
  other_site: "Other websites",
  campaign: "Tagged campaign",
};

const HOST_RULES: Array<[RegExp, TrafficSource]> = [
  [/(^|\.)(whatsapp\.com|wa\.me|whatsapp\.net)$/, "whatsapp"],
  [/(^|\.)(instagram\.com|ig\.me)$/, "instagram"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, "x"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)(yahoo\.com|duckduckgo\.com|yandex\.[a-z]+|baidu\.com|ecosia\.org)$/, "other_search"],
];

const UTM_RULES: Array<[RegExp, TrafficSource]> = [
  [/whats\s*app|^wa$/, "whatsapp"],
  [/insta|^ig$/, "instagram"],
  [/facebook|^fb$|messenger/, "facebook"],
  [/tiktok/, "tiktok"],
  [/twitter|^x$/, "x"],
  [/google/, "google"],
  [/bing/, "bing"],
];

export function getReferrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) {
    return null;
  }

  try {
    return new URL(referrer).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function classifyTrafficSource(input: {
  referrer?: string | null;
  utmSource?: string | null;
  siteHost?: string | null;
}): { source: TrafficSource; referrerHost: string | null } {
  const utm = input.utmSource?.trim().toLowerCase();
  const referrerHost = getReferrerHost(input.referrer);
  const siteHost = input.siteHost?.toLowerCase().replace(/^www\./, "").split(":")[0];
  const externalHost = referrerHost && referrerHost !== siteHost ? referrerHost : null;

  if (utm) {
    const match = UTM_RULES.find(([pattern]) => pattern.test(utm));
    return { source: match?.[1] ?? "campaign", referrerHost: externalHost };
  }

  if (!externalHost) {
    return { source: "direct", referrerHost: null };
  }

  const match = HOST_RULES.find(([pattern]) => pattern.test(externalHost));
  return { source: match?.[1] ?? "other_site", referrerHost: externalHost };
}

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface ParsedUserAgent {
  deviceType: DeviceType;
  browser: string | null;
  os: string | null;
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp\/|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|axios|node-fetch|go-http/i;

/** Link-preview fetchers and crawlers are not visitors. */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  const ua = userAgent ?? "";
  const isTablet = /ipad|tablet|(android(?!.*mobile))|kindle|silk/i.test(ua);
  const isMobile = !isTablet && /mobi|iphone|ipod|android|opera mini|iemobile/i.test(ua);

  let os: string | null = null;
  if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
  else if (/cros/i.test(ua)) os = "ChromeOS";
  else if (/linux/i.test(ua)) os = "Linux";

  let browser: string | null = null;
  if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/edg\//i.test(ua)) browser = "Edge";
  else if (/samsungbrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/fban|fbav|instagram/i.test(ua)) browser = "In-app (Facebook/Instagram)";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua)) browser = "Safari";

  return {
    deviceType: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
    browser,
    os,
  };
}

/**
 * Paths are stored without query strings or fragments: query strings can
 * carry phone numbers (order lookup) and add no reporting value.
 */
export function normalizeEventPath(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? "/";
  const trimmed = clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
  return (trimmed || "/").slice(0, 200);
}

/** Groups dynamic routes so "/orders/SFB-123/invoice" reports as one page. */
export function describePath(path: string): string {
  if (path === "/") return "Homepage";
  if (path === "/menu") return "Menu";
  if (path.startsWith("/products/")) return "Product page";
  if (path === "/cart") return "Cart";
  if (path === "/checkout") return "Checkout";
  if (/^\/orders\/[^/]+\/invoice$/.test(path)) return "Invoice / payment page";
  if (path === "/track-order") return "Track order";
  if (path === "/weekly-offers") return "Weekly offers";
  if (path === "/reviews") return "Reviews";
  if (path === "/about") return "About";
  if (path === "/contact") return "Contact";
  if (path === "/sign-in") return "Sign in";
  if (path === "/register") return "Create account";
  if (path.startsWith("/account")) return "Customer account";
  return path;
}

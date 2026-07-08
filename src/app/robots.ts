import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/menu",
        "/products",
        "/reviews",
        "/about",
        "/contact",
        "/privacy",
        "/terms",
      ],
      disallow: [
        "/admin",
        "/api",
        "/account",
        "/cart",
        "/checkout",
        "/orders",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

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

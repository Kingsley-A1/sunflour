import type { MetadataRoute } from "next";

const staticRoutes = [
  "/",
  "/menu",
  "/reviews",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/" || route === "/menu" ? "daily" : "monthly",
    priority: route === "/" ? 1 : route === "/menu" ? 0.9 : 0.5,
  }));
}

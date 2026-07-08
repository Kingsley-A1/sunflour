import type { MetadataRoute } from "next";
import { getPublicMenuSafe } from "@/lib/api/server";
import { getSiteUrl } from "@/lib/seo/site-url";

// Regenerate per request so newly published products appear without a redeploy.
export const dynamic = "force-dynamic";

const staticRoutes = [
  "/",
  "/menu",
  "/reviews",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/" || route === "/menu" ? "daily" : "monthly",
    priority: route === "/" ? 1 : route === "/menu" ? 0.9 : 0.5,
  }));

  // Public product pages. getPublicMenuSafe never throws, so a DB issue simply
  // yields the static routes instead of breaking the sitemap.
  const { menu } = await getPublicMenuSafe();

  if (menu) {
    const productSlugs = new Set<string>();

    for (const category of menu.categories) {
      for (const product of category.products) {
        productSlugs.add(product.slug);
      }
    }

    for (const slug of productSlugs) {
      entries.push({
        url: `${baseUrl}/products/${slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}

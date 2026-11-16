import { hasSellablePrice, startingPrice } from "@/lib/product-pricing";
import { getSiteUrl } from "@/lib/seo/site-url";
import type { PublicContactConfig } from "@/server/config/public-contact";
import type { PublicProduct } from "@/types/domain";

/**
 * schema.org Bakery / LocalBusiness for the homepage. Powers local rich results
 * and ties the brand to its socials (sameAs) and contact details.
 */
export function buildBakeryJsonLd(
  contact: PublicContactConfig,
): Record<string, unknown> {
  const baseUrl = getSiteUrl();
  const sameAs = [
    contact.instagramHref,
    contact.tiktokHref,
    contact.facebookHref,
  ].filter((href): href is string => Boolean(href));

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: contact.businessName,
    url: baseUrl,
    image: `${baseUrl}/og-image.png`,
    priceRange: "₦₦",
    servesCuisine: "Bakery",
  };

  if (contact.phoneNumber) {
    data.telephone = contact.phoneNumber;
  }

  if (contact.emailAddress) {
    data.email = contact.emailAddress;
  }

  if (contact.address) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressLocality: "Calabar",
      addressCountry: "NG",
    };
  }

  if (sameAs.length > 0) {
    data.sameAs = sameAs;
  }

  return data;
}

/**
 * schema.org Product + Offer for a product page. Price is converted from kobo
 * (stored minor units) to NGN; availability reflects the live orderable flag.
 */
export function buildProductJsonLd(
  product: PublicProduct,
  categoryName?: string,
): Record<string, unknown> {
  const baseUrl = getSiteUrl();
  const images = product.images
    .map((image) => image.url)
    .filter((url): url is string => Boolean(url));

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: `${baseUrl}/products/${product.slug}`,
  };

  const availability = product.isOrderable
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const sizePrices = product.variants
    .map((variant) => variant.price)
    .filter((price) => price > 0);

  // Sized products advertise their price range; unpriced products advertise
  // no offer at all rather than a misleading ₦0.
  if (sizePrices.length > 1) {
    data.offers = {
      "@type": "AggregateOffer",
      lowPrice: (Math.min(...sizePrices) / 100).toFixed(2),
      highPrice: (Math.max(...sizePrices) / 100).toFixed(2),
      offerCount: sizePrices.length,
      priceCurrency: "NGN",
      availability,
      url: `${baseUrl}/products/${product.slug}`,
    };
  } else if (hasSellablePrice(product)) {
    data.offers = {
      "@type": "Offer",
      price: (startingPrice(product) / 100).toFixed(2),
      priceCurrency: "NGN",
      availability,
      url: `${baseUrl}/products/${product.slug}`,
    };
  }

  if (product.description) {
    data.description = product.description;
  }

  if (images.length > 0) {
    data.image = images;
  }

  if (categoryName) {
    data.category = categoryName;
  }

  return data;
}

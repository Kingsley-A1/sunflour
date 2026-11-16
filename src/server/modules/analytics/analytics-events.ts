/**
 * The storefront journey events Sunflour records. Keep this list small and
 * meaningful: every name here maps to a question an owner actually asks
 * ("how many people reached checkout?"), not to every click on the page.
 */
export const SITE_EVENT_NAMES = [
  "page_view",
  "product_view",
  "search",
  "add_to_cart",
  "checkout_start",
  "checkout_submit",
  "checkout_error",
  "order_placed",
  "proof_sent",
  "product_share",
] as const;

export type SiteEventName = (typeof SITE_EVENT_NAMES)[number];

/**
 * Journey stages, in order. A visit is placed at the furthest stage it
 * reached, so the funnel always narrows and reads as "got at least this far".
 */
export const JOURNEY_STAGES = [
  {
    key: "visited",
    label: "Visited the site",
    description: "Opened any Sunflour page.",
  },
  {
    key: "browsed",
    label: "Browsed the menu",
    description: "Opened the menu or a product, or searched.",
  },
  {
    key: "added_to_cart",
    label: "Added to cart",
    description: "Put at least one item in the cart.",
  },
  {
    key: "started_checkout",
    label: "Started checkout",
    description: "Opened the checkout form with items in the cart.",
  },
  {
    key: "placed_order",
    label: "Placed an order",
    description: "Submitted checkout and received an invoice.",
  },
  {
    key: "sent_proof",
    label: "Sent payment proof",
    description: "Tapped “Send proof on WhatsApp” or staff saw the proof.",
  },
  {
    key: "paid",
    label: "Payment confirmed",
    description: "Staff verified the bank transfer.",
  },
] as const;

export type JourneyStageKey = (typeof JOURNEY_STAGES)[number]["key"];

/** Stage index (0-based) an event proves a visit reached. */
export function stageForEvent(name: string, path: string): number {
  switch (name) {
    case "proof_sent":
      return 5;
    case "order_placed":
      return 4;
    case "checkout_start":
    case "checkout_submit":
    case "checkout_error":
      return 3;
    case "add_to_cart":
      return 2;
    case "product_view":
    case "search":
      return 1;
    case "page_view":
      return isBrowsePath(path) ? 1 : 0;
    default:
      return 0;
  }
}

function isBrowsePath(path: string): boolean {
  return (
    path === "/menu" ||
    path.startsWith("/menu/") ||
    path.startsWith("/products/") ||
    path === "/weekly-offers"
  );
}

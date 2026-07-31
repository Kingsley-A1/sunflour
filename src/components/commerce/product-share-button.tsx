"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatNairaFromKobo } from "@/lib/formatters";

interface ProductShareButtonProps {
  productName: string;
  price: number;
  /** Headline of the live weekly offer, when this product is the offer. */
  offerHeadline?: string | null;
}

function buildShareMessage(
  productName: string,
  price: number,
  offerHeadline?: string | null,
): string {
  const opening = `I found this yummy ${productName} at Sunflour Bakery for ${formatNairaFromKobo(price)}`;

  return offerHeadline
    ? `${opening} — and it's this week's offer: ${offerHeadline}! Check it out!`
    : `${opening} — check it out!`;
}

/**
 * Shares the current product page. Uses the native share sheet where available
 * (mobile), otherwise copies the link to the clipboard. The page's Open Graph
 * image is the product's first image, so shared links preview with the photo.
 */
export function ProductShareButton({
  productName,
  price,
  offerHeadline,
}: ProductShareButtonProps) {
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);

  async function shareProduct() {
    const url = window.location.href;
    const message = buildShareMessage(productName, price, offerHeadline);

    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: message,
          url,
        });
        return;
      } catch (error) {
        // Dismissing the share sheet is not an error worth surfacing.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        // Otherwise fall through to the clipboard fallback below.
      }
    }

    try {
      await navigator.clipboard.writeText(`${message} ${url}`);
      setCopied(true);
      notify("Message copied. Share it anywhere!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("Could not share. Copy the link from your address bar.", "error");
    }
  }

  return (
    <Button
      icon={
        copied ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden="true" />
        )
      }
      onClick={shareProduct}
      variant="secondary"
    >
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}

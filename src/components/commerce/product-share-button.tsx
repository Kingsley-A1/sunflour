"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ProductShareButtonProps {
  productName: string;
  shareText?: string;
}

/**
 * Shares the current product page. Uses the native share sheet where available
 * (mobile), otherwise copies the link to the clipboard. The page's Open Graph
 * image is the product's first image, so shared links preview with the photo.
 */
export function ProductShareButton({
  productName,
  shareText,
}: ProductShareButtonProps) {
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);

  async function shareProduct() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText ?? `${productName} from Sunflour Bakery`,
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
      await navigator.clipboard.writeText(url);
      setCopied(true);
      notify("Link copied. Share it anywhere!", "success");
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

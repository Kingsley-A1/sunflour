"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackJourney } from "@/lib/analytics/journey";

/** Records a page view whenever the storefront route changes. */
export function JourneyTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackJourney("page_view");
  }, [pathname]);

  return null;
}

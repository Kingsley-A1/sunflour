import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { PageLoadingLine } from "@/components/ui/page-loading-line";
import { ToastProvider } from "@/components/ui/toast";
import { getSiteUrl } from "@/lib/seo/site-url";
import "./globals.css";

const siteDescription =
  "Sunflour Bakery in Calabar — order fresh breads, celebration cakes, and everyday pastries online for pickup or delivery, with secure bank-transfer checkout.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
  title: {
    default: "Sunflour Bakery | Fresh cakes, breads & pastries in Calabar",
    template: "%s | Sunflour Bakery",
  },
  description: siteDescription,
  keywords: [
    "Sunflour Bakery",
    "bakery Calabar",
    "cakes Calabar",
    "birthday cakes Calabar",
    "bread delivery Calabar",
    "pastries Nigeria",
    "order cake online Nigeria",
  ],
  applicationName: "Sunflour Bakery",
  openGraph: {
    title: "Sunflour Bakery | Fresh cakes, breads & pastries in Calabar",
    description: siteDescription,
    siteName: "Sunflour Bakery",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sunflour Bakery",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunflour Bakery | Fresh cakes, breads & pastries in Calabar",
    description: siteDescription,
    images: ["/og-image.png"],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <PageLoadingLine />
        </Suspense>
        <OfflineBanner />
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}

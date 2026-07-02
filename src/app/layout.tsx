import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { PageLoadingLine } from "@/components/ui/page-loading-line";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const siteDescription =
  "Sunflour Bakery in Calabar — order fresh breads, celebration cakes, and everyday pastries online for pickup or delivery, with secure bank-transfer checkout.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  icons: {
    icon: [
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/logo.png",
        type: "image/png",
      },
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunflour Bakery | Fresh cakes, breads & pastries in Calabar",
    description: siteDescription,
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

import type { Metadata } from "next";
import { Suspense } from "react";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { PageLoadingLine } from "@/components/ui/page-loading-line";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Sunflour Bakery",
    template: "%s | Sunflour Bakery",
  },
  description:
    "Browse Sunflour Bakery menu, order for pickup or delivery, view invoices, and send payment proof through WhatsApp.",
  openGraph: {
    title: "Sunflour Bakery",
    description:
      "Fresh bakery, meals, checkout, invoice, and manual Moniepoint transfer instructions.",
    siteName: "Sunflour Bakery",
    type: "website",
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
      </body>
    </html>
  );
}

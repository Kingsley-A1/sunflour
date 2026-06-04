import type { Metadata } from "next";
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

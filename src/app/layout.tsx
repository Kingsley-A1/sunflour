import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunflour Bakery",
  description: "Sunflour Bakery ordering platform foundation.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

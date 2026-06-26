"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadInvoiceButtonProps {
  html: string;
  invoiceNumber: string;
}

function fileSafeName(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "invoice"
  );
}

export function DownloadInvoiceButton({
  html,
  invoiceNumber,
}: DownloadInvoiceButtonProps) {
  function downloadInvoice() {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${fileSafeName(invoiceNumber)}.html`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      icon={<Download className="h-4 w-4" aria-hidden="true" />}
      onClick={downloadInvoice}
      variant="secondary"
    >
      Download invoice
    </Button>
  );
}

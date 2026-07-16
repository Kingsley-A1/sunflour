import { describe, expect, it } from "vitest";
import { EmailTemplateKey } from "@/generated/prisma/enums";
import { renderEmailTemplate } from "@/server/modules/email/email-template-service";

describe("email template service", () => {
  it("renders purchase invoice email with stable order data", () => {
    const rendered = renderEmailTemplate({
      key: EmailTemplateKey.PURCHASE_INVOICE,
      payload: {
        orderNumber: "SFB-20260101-ABC123",
        customerName: "Ada Baker",
        amountPaid: 500_000,
        deliveryFeeDueOnDelivery: 200_000,
        total: 700_000,
        invoiceNumber: "INV-SFB-20260101-ABC123",
        invoiceUrl:
          "https://sunflour.test/api/v1/public/invoices/SFB-20260101-ABC123?token=invoice-token",
      },
    });

    expect(rendered.subject).toContain("INV-SFB-20260101-ABC123");
    expect(rendered.html).toContain("SFB-20260101-ABC123");
    expect(rendered.html).toContain("INV-SFB-20260101-ABC123");
    expect(rendered.html).toContain("Ada Baker");
    expect(rendered.html).toContain("5,000");
    expect(rendered.html).toContain("Delivery fee");
    expect(rendered.html).toContain("7,000");
  });

  it("renders the order confirmation with a friendly heading and product names", () => {
    const rendered = renderEmailTemplate({
      key: EmailTemplateKey.ORDER_CONFIRMATION,
      payload: {
        orderNumber: "SFB-20260101-ABC123",
        customerName: "Ada Baker",
        items: [
          { name: "Regular Shawarma", quantity: 2, lineTotal: 900_000 },
          { name: "Special Shawarma (Large)", quantity: 1, lineTotal: 450_000 },
        ],
        amountPaid: 1_350_000,
        deliveryFeeDueOnDelivery: 0,
        total: 1_350_000,
        invoiceNumber: "INV-SFB-20260101-ABC123",
      },
    });

    expect(rendered.subject).toBe("We received your order - Sunflour Bakery");
    expect(rendered.html).toContain("Order Received!");
    // Product names, not just the order ID.
    expect(rendered.html).toContain("Regular Shawarma");
    expect(rendered.html).toContain("Special Shawarma (Large)");
    // Rendered as a table with quantities.
    expect(rendered.html).toContain("<table");
    expect(rendered.html).toContain("packaging your order");
  });

  it("renders a warm payment-confirmed status email", () => {
    const rendered = renderEmailTemplate({
      key: EmailTemplateKey.ORDER_STATUS_UPDATE,
      payload: {
        orderNumber: "SFB-20260101-ABC123",
        customerName: "Ada Baker",
        status: "Payment confirmed",
        statusKey: "PAYMENT_CONFIRMED",
      },
    });

    expect(rendered.subject).toContain("Payment confirmed");
    expect(rendered.html).toContain("confirmed your payment");
    expect(rendered.html).toContain("please call again");
    expect(rendered.html).toContain("The Sunflour Bakery Team");
  });

  it("renders a generic status email for other statuses", () => {
    const rendered = renderEmailTemplate({
      key: EmailTemplateKey.ORDER_STATUS_UPDATE,
      payload: {
        orderNumber: "SFB-20260101-ABC123",
        customerName: "Ada Baker",
        status: "Out for delivery",
        statusKey: "OUT_FOR_DELIVERY",
      },
    });

    expect(rendered.html).toContain("your order status is now Out for delivery");
  });

  it("rejects invalid template keys", () => {
    expect(() =>
      renderEmailTemplate({
        key: "MARKETING_BLAST" as EmailTemplateKey,
        payload: {},
      }),
    ).toThrow("Unsupported transactional email template");
  });
});

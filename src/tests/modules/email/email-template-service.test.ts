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

  it("rejects invalid template keys", () => {
    expect(() =>
      renderEmailTemplate({
        key: "MARKETING_BLAST" as EmailTemplateKey,
        payload: {},
      }),
    ).toThrow("Unsupported transactional email template");
  });
});

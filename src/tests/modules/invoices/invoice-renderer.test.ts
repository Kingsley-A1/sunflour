import { describe, expect, it } from "vitest";
import {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import {
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  generateInvoiceNumber,
  renderInvoiceHtml,
} from "@/server/modules/invoices";
import type { InvoiceRenderOrder } from "@/server/modules/invoices";

const createdAt = new Date("2026-01-01T10:00:00.000Z");

function invoiceOrder(): InvoiceRenderOrder {
  return {
    orderNumber: "SFB-20260101-ABC123",
    customerNameSnapshot: "Ada Baker",
    customerPhoneSnapshot: "+2348012345678",
    customerEmailSnapshot: "ada@example.com",
    deliveryMethod: DeliveryMethod.DELIVERY,
    deliveryAddressSnapshot: "12 Bakery Street",
    deliveryZoneNameSnapshot: "Central Bakery Area",
    deliveryBaseFeeSnapshot: 150_000,
    deliverySurchargeSnapshot: 50_000,
    deliveryTotalFeeSnapshot: 200_000,
    subtotal: 500_000,
    total: 700_000,
    status: OrderStatus.PENDING_PAYMENT,
    paymentStatus: PaymentStatus.UNPAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    paymentInstructionSnapshot:
      "Bank Name: Moniepoint\nAccount Name: Sunflour Bakery\nAccount Number: 1234567890",
    proofWhatsappNumberSnapshot: "2348012345678",
    createdAt,
    items: [
      {
        productNameSnapshot: "Chocolate Cake",
        variantNameSnapshot: "Slice",
        unitPriceSnapshot: 250_000,
        quantity: 2,
        lineTotal: 500_000,
      },
    ],
  };
}

describe("invoice renderer", () => {
  it("generates stable invoice numbers from order numbers", () => {
    expect(generateInvoiceNumber("SFB-20260101-ABC123")).toBe(
      "INV-SFB-20260101-ABC123",
    );
  });

  it("renders totals from order snapshots", () => {
    const html = renderInvoiceHtml({
      invoiceNumber: "INV-SFB-20260101-ABC123",
      generatedAt: createdAt,
      order: invoiceOrder(),
    });

    expect(html).toContain("Chocolate Cake");
    expect(html).toContain("Slice");
    expect(html).toContain("7,000");
    expect(html).toContain("Moniepoint");
  });

  it("keeps old invoice HTML stable after later product and delivery edits", () => {
    const order = invoiceOrder();
    const htmlSnapshot = renderInvoiceHtml({
      invoiceNumber: "INV-SFB-20260101-ABC123",
      generatedAt: createdAt,
      order,
    });
    const originalItem = order.items[0];

    if (!originalItem) {
      throw new Error("Expected invoice test item.");
    }

    order.items[0] = {
      ...originalItem,
      productNameSnapshot: "Updated Chocolate Cake",
      unitPriceSnapshot: 300_000,
      lineTotal: 600_000,
    };
    order.deliveryTotalFeeSnapshot = 250_000;
    order.total = 850_000;

    expect(htmlSnapshot).toContain("Chocolate Cake");
    expect(htmlSnapshot).not.toContain("Updated Chocolate Cake");
    expect(htmlSnapshot).toContain("7,000");
    expect(htmlSnapshot).not.toContain("8,500");
  });

  it("renders user-friendly payment method and status labels", () => {
    const html = renderInvoiceHtml({
      invoiceNumber: "INV-SFB-20260101-ABC123",
      generatedAt: createdAt,
      order: {
        ...invoiceOrder(),
        paymentStatus: PaymentStatus.PROOF_SENT_ON_WHATSAPP,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      },
    });

    expect(html).toContain("Bank transfer");
    expect(html).not.toContain("BANK_TRANSFER");
    expect(html).toContain("Proof sent on WhatsApp");
    expect(html).not.toContain("PROOF_SENT_ON_WHATSAPP");
  });

  it("maps payment enums to friendly labels", () => {
    expect(formatPaymentMethodLabel(PaymentMethod.BANK_TRANSFER)).toBe(
      "Bank transfer",
    );
    expect(formatPaymentStatusLabel(PaymentStatus.UNDER_REVIEW)).toBe(
      "Under review",
    );
    expect(formatPaymentStatusLabel(PaymentStatus.CONFIRMED)).toBe("Confirmed");
  });

  it("escapes customer and item content in the HTML snapshot", () => {
    const order = invoiceOrder();
    order.customerNameSnapshot = "<script>alert('x')</script>";

    const html = renderInvoiceHtml({
      invoiceNumber: "INV-SFB-20260101-ABC123",
      generatedAt: createdAt,
      order,
    });

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
  });
});

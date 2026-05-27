import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import { formatNairaFromKobo } from "@/server/lib/money/money";

export interface InvoiceRenderItem {
  productNameSnapshot: string;
  variantNameSnapshot: string | null;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

export interface InvoiceRenderOrder {
  orderNumber: string;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string;
  customerEmailSnapshot: string | null;
  deliveryMethod: DeliveryMethod;
  deliveryAddressSnapshot: string | null;
  deliveryZoneNameSnapshot: string | null;
  deliveryBaseFeeSnapshot: number;
  deliverySurchargeSnapshot: number;
  deliveryTotalFeeSnapshot: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentInstructionSnapshot: string;
  proofWhatsappNumberSnapshot: string | null;
  createdAt: Date;
  items: InvoiceRenderItem[];
}

export interface InvoiceRenderInput {
  invoiceNumber: string;
  generatedAt: Date;
  order: InvoiceRenderOrder;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(value);
}

function renderAddress(order: InvoiceRenderOrder): string {
  if (order.deliveryMethod === "PICKUP") {
    return "Pickup at Sunflour Bakery";
  }

  return [
    order.deliveryZoneNameSnapshot,
    order.deliveryAddressSnapshot,
  ]
    .filter(Boolean)
    .map((value) => escapeHtml(String(value)))
    .join("<br />");
}

function renderPaymentInstruction(instruction: string): string {
  return escapeHtml(instruction).replaceAll("\n", "<br />");
}

function renderItems(items: readonly InvoiceRenderItem[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td>
            <strong>${escapeHtml(item.productNameSnapshot)}</strong>
            ${
              item.variantNameSnapshot
                ? `<br /><span>${escapeHtml(item.variantNameSnapshot)}</span>`
                : ""
            }
          </td>
          <td>${formatNairaFromKobo(item.unitPriceSnapshot)}</td>
          <td>${item.quantity}</td>
          <td>${formatNairaFromKobo(item.lineTotal)}</td>
        </tr>
      `,
    )
    .join("");
}

export function renderInvoiceHtml({
  invoiceNumber,
  generatedAt,
  order,
}: InvoiceRenderInput): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(invoiceNumber)} - Sunflour Bakery Invoice</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; color: #24150d; background: #fff8ec; }
      main { max-width: 760px; margin: 0 auto; padding: 32px 20px; background: #ffffff; }
      header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #e9dcc8; padding-bottom: 20px; }
      h1, h2, p { margin-top: 0; }
      h1 { color: #b22416; font-size: 28px; }
      h2 { font-size: 18px; margin-bottom: 10px; }
      section { margin-top: 24px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border-bottom: 1px solid #e9dcc8; padding: 12px 8px; text-align: left; vertical-align: top; }
      th { background: #fff3b0; font-size: 13px; text-transform: uppercase; }
      td:last-child, th:last-child { text-align: right; }
      .muted { color: #6f4b33; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
      .summary { margin-left: auto; max-width: 340px; }
      .summary-row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; }
      .total { border-top: 2px solid #b22416; font-weight: 700; font-size: 18px; }
      .payment { background: #fff8ec; border: 1px solid #e9dcc8; padding: 16px; }
      @media print { body { background: #ffffff; } main { padding: 0; } }
      @media (max-width: 640px) { header, .grid { display: block; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>Sunflour Bakery</h1>
          <p class="muted">Purchase invoice</p>
        </div>
        <div>
          <p><strong>Invoice:</strong> ${escapeHtml(invoiceNumber)}</p>
          <p><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>
          <p><strong>Generated:</strong> ${escapeHtml(formatDate(generatedAt))}</p>
        </div>
      </header>

      <section class="grid">
        <div>
          <h2>Customer</h2>
          <p>
            ${escapeHtml(order.customerNameSnapshot)}<br />
            ${escapeHtml(order.customerPhoneSnapshot)}
            ${
              order.customerEmailSnapshot
                ? `<br />${escapeHtml(order.customerEmailSnapshot)}`
                : ""
            }
          </p>
        </div>
        <div>
          <h2>Fulfillment</h2>
          <p>${renderAddress(order)}</p>
          <p class="muted">Order created: ${escapeHtml(formatDate(order.createdAt))}</p>
        </div>
      </section>

      <section>
        <h2>Items</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Unit price</th>
              <th>Qty</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>${renderItems(order.items)}</tbody>
        </table>
      </section>

      <section class="summary">
        <div class="summary-row"><span>Subtotal</span><span>${formatNairaFromKobo(order.subtotal)}</span></div>
        <div class="summary-row"><span>Delivery base fee</span><span>${formatNairaFromKobo(order.deliveryBaseFeeSnapshot)}</span></div>
        <div class="summary-row"><span>Delivery surcharge</span><span>${formatNairaFromKobo(order.deliverySurchargeSnapshot)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatNairaFromKobo(order.total)}</span></div>
      </section>

      <section class="payment">
        <h2>Payment</h2>
        <p><strong>Status:</strong> ${escapeHtml(order.paymentStatus)}</p>
        <p><strong>Method:</strong> ${escapeHtml(order.paymentMethod)}</p>
        <p>${renderPaymentInstruction(order.paymentInstructionSnapshot)}</p>
      </section>
    </main>
  </body>
</html>`;
}

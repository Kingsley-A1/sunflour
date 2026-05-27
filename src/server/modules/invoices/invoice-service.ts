import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import {
  generateInvoiceAccessToken,
  generateInvoiceNumber,
} from "./invoice-ids";
import { renderInvoiceHtml } from "./invoice-renderer";

const invoiceOrderInclude = {
  items: {
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.OrderInclude;

const invoiceSelect = {
  id: true,
  invoiceNumber: true,
  htmlSnapshot: true,
  pdfUrl: true,
  generatedAt: true,
  createdAt: true,
  order: {
    select: {
      orderNumber: true,
      customerNameSnapshot: true,
      customerPhoneSnapshot: true,
      customerEmailSnapshot: true,
      subtotal: true,
      total: true,
      status: true,
      paymentStatus: true,
    },
  },
} satisfies Prisma.InvoiceSelect;

type InvoiceOrder = Prisma.OrderGetPayload<{
  include: typeof invoiceOrderInclude;
}>;

export type InvoiceResponse = Prisma.InvoiceGetPayload<{
  select: typeof invoiceSelect;
}>;

export interface CreatedInvoiceResult {
  invoice: InvoiceResponse;
  publicAccessToken: string;
}

function notFound(): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: "Invoice not found.",
    status: 404,
  });
}

function forbidden(): AppError {
  return new AppError({
    code: ERROR_CODES.FORBIDDEN,
    publicMessage: "You do not have access to this invoice.",
    status: 403,
  });
}

export function buildInvoicePublicUrl(
  orderNumber: string,
  publicAccessToken: string,
): string {
  return `/api/v1/public/invoices/${encodeURIComponent(
    orderNumber,
  )}?token=${encodeURIComponent(publicAccessToken)}`;
}

export async function createInvoiceForOrder(
  order: InvoiceOrder,
): Promise<CreatedInvoiceResult> {
  const invoiceNumber = generateInvoiceNumber(order.orderNumber);
  const publicAccessToken = generateInvoiceAccessToken();
  const generatedAt = new Date();
  const htmlSnapshot = renderInvoiceHtml({
    invoiceNumber,
    generatedAt,
    order,
  });
  const invoice = await prisma.invoice.create({
    data: {
      orderId: order.id,
      invoiceNumber,
      publicAccessToken,
      htmlSnapshot,
      generatedAt,
    },
    select: invoiceSelect,
  });

  return {
    invoice,
    publicAccessToken,
  };
}

export async function getPublicInvoice(
  orderNumber: string,
  publicAccessToken?: string | null,
): Promise<InvoiceResponse> {
  if (!publicAccessToken) {
    throw notFound();
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      publicAccessToken,
      order: {
        orderNumber,
      },
    },
    select: invoiceSelect,
  });

  if (!invoice) {
    throw notFound();
  }

  return invoice;
}

export async function getCustomerInvoice(
  orderNumber: string,
  user: AuthenticatedUser,
): Promise<InvoiceResponse> {
  const invoice = await prisma.invoice.findFirst({
    where: {
      order: {
        orderNumber,
        userId: user.id,
      },
    },
    select: invoiceSelect,
  });

  if (!invoice) {
    throw forbidden();
  }

  return invoice;
}

export async function getAdminInvoice(
  orderNumber: string,
): Promise<InvoiceResponse> {
  const invoice = await prisma.invoice.findFirst({
    where: {
      order: {
        orderNumber,
      },
    },
    select: invoiceSelect,
  });

  if (!invoice) {
    throw notFound();
  }

  return invoice;
}

export { invoiceOrderInclude };

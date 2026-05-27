import { z } from "zod";

export const invoiceOrderNumberParamSchema = z.object({
  orderNumber: z.string().trim().min(1).max(80),
});

export const publicInvoiceQuerySchema = z.object({
  token: z.string().trim().min(24).max(160).optional(),
});

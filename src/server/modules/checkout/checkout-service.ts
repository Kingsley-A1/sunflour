import type { Prisma } from "@/generated/prisma/client";
import {
  CustomerType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
} from "@/generated/prisma/enums";
import type {
  CustomerType as CustomerTypeValue,
  OrderStatus as OrderStatusValue,
  PaymentMethod as PaymentMethodValue,
  PaymentStatus as PaymentStatusValue,
} from "@/generated/prisma/enums";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { getServerEnv } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { addKobo, multiplyKobo } from "@/server/lib/money/money";
import { buildDeliveryFeeSnapshot } from "@/server/modules/delivery/delivery-snapshot";
import { getDeliveryQuote } from "@/server/modules/delivery/delivery-service";
import {
  buildCatalogLineItemSnapshot,
  type CatalogLineItemSnapshot,
} from "@/server/modules/menu/product-snapshot";
import {
  buildIdempotencyRequestHash,
  generateOrderNumber,
} from "./checkout-ids";
import {
  buildWhatsAppProofMessage,
  buildWhatsAppProofUrl,
} from "./checkout-payment";
import { getActivePaymentSnapshot } from "@/server/modules/payments/payment-service";
import {
  buildInvoicePublicUrl,
  generateInvoiceAccessToken,
  generateInvoiceNumber,
  renderInvoiceHtml,
} from "@/server/modules/invoices";
import {
  queueAdminNewOrderAlertEmailsForOrder,
  queueOrderConfirmationEmailForOrder,
} from "@/server/modules/email";
import type { CheckoutCreateInput, CheckoutItemInput } from "./checkout-schemas";

const checkoutProductInclude = {
  category: {
    select: {
      isActive: true,
    },
  },
  variants: true,
} satisfies Prisma.ProductInclude;

const checkoutOrderInclude = {
  items: {
    orderBy: {
      createdAt: "asc",
    },
  },
  invoice: {
    select: {
      invoiceNumber: true,
      publicAccessToken: true,
    },
  },
} satisfies Prisma.OrderInclude;

type CheckoutProduct = Prisma.ProductGetPayload<{
  include: typeof checkoutProductInclude;
}>;

type CheckoutOrder = Prisma.OrderGetPayload<{
  include: typeof checkoutOrderInclude;
}>;

export interface ResolvedCheckoutLineItem extends CatalogLineItemSnapshot {
  productId: string;
  variantId: string | null;
}

export interface CheckoutOrderResponse {
  orderNumber: string;
  customerType: CustomerTypeValue;
  status: OrderStatusValue;
  paymentStatus: PaymentStatusValue;
  paymentMethod: PaymentMethodValue;
  subtotal: number;
  total: number;
  delivery: {
    method: DeliveryMethod;
    address: string | null;
    zoneId: string | null;
    zoneName: string | null;
    baseFee: number;
    surcharge: number;
    totalFee: number;
  };
  items: Array<{
    productName: string;
    variantName: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  invoiceNumber: string | null;
  paymentInstruction: string;
  invoiceUrl: string;
  whatsAppProofUrl: string;
  whatsAppProofMessage: string;
}

function checkoutItemUnavailable(
  field: string,
  message: string,
): AppError {
  return new AppError({
    code: ERROR_CODES.CHECKOUT_ITEM_UNAVAILABLE,
    publicMessage: message,
    status: 400,
    fieldErrors: {
      [field]: [message],
    },
  });
}

function idempotencyConflict(): AppError {
  return new AppError({
    code: ERROR_CODES.IDEMPOTENCY_CONFLICT,
    publicMessage:
      "This idempotency key was already used for a different checkout request.",
    status: 409,
    fieldErrors: {
      idempotencyKey: [
        "Use a new idempotency key for a different checkout request.",
      ],
    },
  });
}

function findVariant(
  product: CheckoutProduct,
  item: CheckoutItemInput,
  index: number,
) {
  if (!item.variantId) {
    return null;
  }

  const variant = product.variants.find(
    (candidate) => candidate.id === item.variantId,
  );

  if (!variant?.isActive) {
    throw checkoutItemUnavailable(
      `items.${index}.variantId`,
      "Choose an active product option.",
    );
  }

  return variant;
}

export function resolveCheckoutLineItems(
  items: readonly CheckoutItemInput[],
  products: readonly CheckoutProduct[],
): ResolvedCheckoutLineItem[] {
  const productsById = new Map(products.map((product) => [product.id, product]));

  return items.map((item, index) => {
    const product = productsById.get(item.productId);

    if (
      !product ||
      !product.category.isActive ||
      product.status !== ProductStatus.ACTIVE
    ) {
      throw checkoutItemUnavailable(
        `items.${index}.productId`,
        "This item is not available for ordering.",
      );
    }

    const variant = findVariant(product, item, index);
    const unitPrice = variant?.price ?? product.basePrice;
    const snapshot = buildCatalogLineItemSnapshot({
      productName: product.name,
      variantName: variant?.name,
      unitPrice,
      quantity: item.quantity,
    });

    return {
      ...snapshot,
      lineTotal: multiplyKobo(unitPrice, item.quantity),
      productId: product.id,
      variantId: variant?.id ?? null,
    };
  });
}

function buildInvoiceUrl(
  orderNumber: string,
  publicAccessToken?: string,
): string {
  const appUrl = getServerEnv().NEXT_PUBLIC_APP_URL;
  const invoicePath = publicAccessToken
    ? buildInvoicePublicUrl(orderNumber, publicAccessToken)
    : `/orders/${orderNumber}/invoice`;

  if (!appUrl) {
    return invoicePath;
  }

  return `${appUrl.replace(/\/$/, "")}${invoicePath}`;
}

function mapCheckoutOrderResponse(order: CheckoutOrder): CheckoutOrderResponse {
  const whatsAppProofMessage = buildWhatsAppProofMessage({
    orderNumber: order.orderNumber,
    customerName: order.customerNameSnapshot,
    amountPaid: order.subtotal,
  });

  return {
    orderNumber: order.orderNumber,
    customerType: order.customerType,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    total: order.total,
    delivery: {
      method: order.deliveryMethod,
      address: order.deliveryAddressSnapshot,
      zoneId: order.deliveryZoneId,
      zoneName: order.deliveryZoneNameSnapshot,
      baseFee: order.deliveryBaseFeeSnapshot,
      surcharge: order.deliverySurchargeSnapshot,
      totalFee: order.deliveryTotalFeeSnapshot,
    },
    items: order.items.map((item) => ({
      productName: item.productNameSnapshot,
      variantName: item.variantNameSnapshot,
      unitPrice: item.unitPriceSnapshot,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    invoiceNumber: order.invoice?.invoiceNumber ?? null,
    paymentInstruction: order.paymentInstructionSnapshot,
    invoiceUrl: buildInvoiceUrl(
      order.orderNumber,
      order.invoice?.publicAccessToken,
    ),
    whatsAppProofUrl: buildWhatsAppProofUrl(
      whatsAppProofMessage,
      order.proofWhatsappNumberSnapshot,
    ),
    whatsAppProofMessage,
  };
}

export async function createCheckoutOrder(
  input: CheckoutCreateInput,
  options: {
    idempotencyKey: string;
    user?: AuthenticatedUser | null;
    now?: Date;
  },
): Promise<CheckoutOrderResponse> {
  const requestHash = buildIdempotencyRequestHash(input);
  const existingOrder = await prisma.order.findUnique({
    where: {
      idempotencyKey: options.idempotencyKey,
    },
    include: checkoutOrderInclude,
  });

  if (existingOrder) {
    if (existingOrder.idempotencyRequestHash !== requestHash) {
      throw idempotencyConflict();
    }

    return mapCheckoutOrderResponse(existingOrder);
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: input.items.map((item) => item.productId),
      },
    },
    include: checkoutProductInclude,
  });
  const lineItems = resolveCheckoutLineItems(input.items, products);
  const subtotal = addKobo(...lineItems.map((item) => item.lineTotal));
  const deliveryQuote = await getDeliveryQuote(
    {
      deliveryMethod: input.delivery.method,
      deliveryZoneId: input.delivery.zoneId,
    },
    options.now,
  );
  const deliverySnapshot = buildDeliveryFeeSnapshot(deliveryQuote);
  const total = addKobo(subtotal, deliverySnapshot.deliveryTotalFeeSnapshot);
  const customerType = options.user
    ? CustomerType.AUTHENTICATED
    : CustomerType.GUEST;
  const orderNumber = generateOrderNumber(options.now);
  const createdAt = options.now ?? new Date();
  const invoiceNumber = generateInvoiceNumber(orderNumber);
  const invoiceAccessToken = generateInvoiceAccessToken();
  const paymentSnapshot = await getActivePaymentSnapshot();
  const invoiceHtmlSnapshot = renderInvoiceHtml({
    invoiceNumber,
    generatedAt: createdAt,
    order: {
      orderNumber,
      customerNameSnapshot: input.customer.fullName,
      customerPhoneSnapshot: input.customer.phone,
      customerEmailSnapshot: input.customer.email ?? null,
      deliveryMethod: input.delivery.method,
      deliveryAddressSnapshot:
        input.delivery.method === DeliveryMethod.DELIVERY
          ? input.delivery.address ?? null
          : null,
      deliveryZoneNameSnapshot: deliverySnapshot.deliveryZoneNameSnapshot,
      deliveryBaseFeeSnapshot: deliverySnapshot.deliveryBaseFeeSnapshot,
      deliverySurchargeSnapshot: deliverySnapshot.deliverySurchargeSnapshot,
      deliveryTotalFeeSnapshot: deliverySnapshot.deliveryTotalFeeSnapshot,
      subtotal,
      total,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentInstructionSnapshot: paymentSnapshot.paymentInstructionSnapshot,
      proofWhatsappNumberSnapshot:
        paymentSnapshot.proofWhatsappNumberSnapshot,
      createdAt,
      items: lineItems,
    },
  });

  const order = await prisma.$transaction(async (transaction) => {
    const createdOrder = await transaction.order.create({
      data: {
        orderNumber,
        idempotencyKey: options.idempotencyKey,
        idempotencyRequestHash: requestHash,
        userId: options.user?.id,
        customerType,
        customerNameSnapshot: input.customer.fullName,
        customerPhoneSnapshot: input.customer.phone,
        customerEmailSnapshot: input.customer.email,
        deliveryMethod: input.delivery.method,
        deliveryAddressSnapshot:
          input.delivery.method === DeliveryMethod.DELIVERY
            ? input.delivery.address
            : null,
        deliveryZoneId:
          input.delivery.method === DeliveryMethod.DELIVERY
            ? deliverySnapshot.deliveryZoneIdSnapshot
            : null,
        deliveryZoneNameSnapshot: deliverySnapshot.deliveryZoneNameSnapshot,
        deliveryBaseFeeSnapshot: deliverySnapshot.deliveryBaseFeeSnapshot,
        deliverySurchargeSnapshot: deliverySnapshot.deliverySurchargeSnapshot,
        deliveryTotalFeeSnapshot: deliverySnapshot.deliveryTotalFeeSnapshot,
        subtotal,
        total,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentInstructionSnapshot: paymentSnapshot.paymentInstructionSnapshot,
        proofWhatsappNumberSnapshot:
          paymentSnapshot.proofWhatsappNumberSnapshot,
        customerNote: input.customerNote,
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productNameSnapshot: item.productNameSnapshot,
            variantNameSnapshot: item.variantNameSnapshot,
            unitPriceSnapshot: item.unitPriceSnapshot,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),
        },
        statusEvents: {
          create: {
            fromStatus: null,
            toStatus: OrderStatus.PENDING_PAYMENT,
            changedByUserId: options.user?.id,
            reason: "Order created from checkout.",
          },
        },
        invoice: {
          create: {
            invoiceNumber,
            publicAccessToken: invoiceAccessToken,
            htmlSnapshot: invoiceHtmlSnapshot,
            generatedAt: createdAt,
          },
        },
      },
      include: checkoutOrderInclude,
    });

    if (options.user) {
      await transaction.cart.deleteMany({
        where: {
          userId: options.user.id,
        },
      });
    }

    return createdOrder;
  });

  try {
    await queueOrderConfirmationEmailForOrder(order);
    await queueAdminNewOrderAlertEmailsForOrder(order);
  } catch {
    // Email outbox issues must not block checkout.
  }

  return mapCheckoutOrderResponse(order);
}

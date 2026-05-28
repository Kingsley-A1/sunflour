import type { Prisma } from "@/generated/prisma/client";
import { CustomerType } from "@/generated/prisma/enums";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { normalizePhoneForComparison } from "@/server/lib/phone";
import { buildInvoicePublicUrl } from "@/server/modules/invoices";
import type {
  CustomerOrderListQueryInput,
  CustomerProfileUpdateInput,
  GuestOrderLookupInput,
} from "./customer-schemas";

const customerProfileSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  customerProfile: {
    select: {
      fullName: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.UserSelect;

const customerOrderListSelect = {
  orderNumber: true,
  customerType: true,
  customerNameSnapshot: true,
  customerPhoneSnapshot: true,
  deliveryMethod: true,
  deliveryZoneNameSnapshot: true,
  subtotal: true,
  total: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  createdAt: true,
  updatedAt: true,
  cancelledAt: true,
  deliveredAt: true,
  invoice: {
    select: {
      invoiceNumber: true,
    },
  },
  _count: {
    select: {
      items: true,
    },
  },
} satisfies Prisma.OrderSelect;

const customerOrderDetailSelect = {
  ...customerOrderListSelect,
  customerEmailSnapshot: true,
  deliveryAddressSnapshot: true,
  deliveryBaseFeeSnapshot: true,
  deliverySurchargeSnapshot: true,
  deliveryTotalFeeSnapshot: true,
  paymentInstructionSnapshot: true,
  proofWhatsappNumberSnapshot: true,
  customerNote: true,
  items: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      productNameSnapshot: true,
      variantNameSnapshot: true,
      unitPriceSnapshot: true,
      quantity: true,
      lineTotal: true,
    },
  },
  invoice: {
    select: {
      invoiceNumber: true,
      publicAccessToken: true,
      pdfUrl: true,
      generatedAt: true,
    },
  },
  statusEvents: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderSelect;

type CustomerOrderDetailRecord = Prisma.OrderGetPayload<{
  select: typeof customerOrderDetailSelect;
}>;

function notFound(): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: "Order not found for those details.",
    status: 404,
  });
}

function profileNotFound(): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: "Customer profile not found.",
    status: 404,
  });
}

function mapCustomerOrderDetail(order: CustomerOrderDetailRecord) {
  return {
    ...order,
    invoiceUrl: order.invoice?.publicAccessToken
      ? buildInvoicePublicUrl(order.orderNumber, order.invoice.publicAccessToken)
      : null,
    invoice: order.invoice
      ? {
          invoiceNumber: order.invoice.invoiceNumber,
          pdfUrl: order.invoice.pdfUrl,
          generatedAt: order.invoice.generatedAt,
        }
      : null,
  };
}

export async function getCustomerProfile(user: AuthenticatedUser) {
  const profile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: customerProfileSelect,
  });

  if (!profile) {
    throw profileNotFound();
  }

  return profile;
}

export async function updateCustomerProfile(
  input: CustomerProfileUpdateInput,
  user: AuthenticatedUser,
) {
  return prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: input.fullName,
        phone: input.phone,
      },
    });

    return transaction.customerProfile.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        fullName: input.fullName,
        phone: input.phone,
      },
      update: {
        fullName: input.fullName,
        phone: input.phone,
      },
    });
  });
}

export async function listCustomerOrders(
  input: CustomerOrderListQueryInput,
  user: AuthenticatedUser,
) {
  const skip = (input.page - 1) * input.pageSize;
  const where = {
    userId: user.id,
  } satisfies Prisma.OrderWhereInput;
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: input.pageSize,
      select: customerOrderListSelect,
    }),
  ]);

  return {
    orders,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      pageCount: Math.ceil(total / input.pageSize),
    },
  };
}

export async function getCustomerOrderDetail(
  orderNumber: string,
  user: AuthenticatedUser,
) {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      userId: user.id,
    },
    select: customerOrderDetailSelect,
  });

  if (!order) {
    throw notFound();
  }

  return mapCustomerOrderDetail(order);
}

export async function lookupGuestOrder(input: GuestOrderLookupInput) {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: input.orderNumber,
    },
    select: customerOrderDetailSelect,
  });

  if (
    !order ||
    normalizePhoneForComparison(order.customerPhoneSnapshot) !==
      normalizePhoneForComparison(input.phone)
  ) {
    throw notFound();
  }

  return mapCustomerOrderDetail(order);
}

export async function countGuestOrders(where: Prisma.OrderWhereInput = {}) {
  return prisma.order.count({
    where: {
      ...where,
      customerType: CustomerType.GUEST,
    },
  });
}

import type { Prisma } from "@/generated/prisma/client";
import { ProductStatus, ReviewStatus } from "@/generated/prisma/enums";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import type {
  AdminReviewListQueryInput,
  PublicReviewCreateInput,
  PublicReviewListQueryInput,
  ReviewModerationInput,
} from "./review-schemas";

const publicReviewSelect = {
  id: true,
  customerNameSnapshot: true,
  rating: true,
  comment: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.ReviewSelect;

const adminReviewSelect = {
  id: true,
  customerNameSnapshot: true,
  rating: true,
  comment: true,
  status: true,
  moderationReason: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ReviewSelect;

function notFound(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: message,
    status: 404,
  });
}

function publicProductNotFound(): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: "Product not found.",
    status: 404,
  });
}

async function assertReviewableProduct(productId?: string): Promise<void> {
  if (!productId) {
    return;
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: {
        not: ProductStatus.HIDDEN,
      },
      category: {
        isActive: true,
      },
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    throw publicProductNotFound();
  }
}

function buildAdminReviewWhere(
  input: AdminReviewListQueryInput,
): Prisma.ReviewWhereInput {
  return {
    status: input.status,
    productId: input.productId,
  };
}

export async function listApprovedReviews(
  input: PublicReviewListQueryInput,
) {
  return prisma.review.findMany({
    where: {
      status: ReviewStatus.APPROVED,
      productId: input.productId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: input.limit,
    select: publicReviewSelect,
  });
}

export async function createPublicReview(
  input: PublicReviewCreateInput,
  user?: AuthenticatedUser | null,
) {
  await assertReviewableProduct(input.productId);

  return prisma.review.create({
    data: {
      userId: user?.id,
      productId: input.productId,
      customerNameSnapshot: input.customerName,
      rating: input.rating,
      comment: input.comment,
      status: ReviewStatus.PENDING,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function listAdminReviews(input: AdminReviewListQueryInput) {
  const where = buildAdminReviewWhere(input);
  const skip = (input.page - 1) * input.pageSize;
  const [total, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: input.pageSize,
      select: adminReviewSelect,
    }),
  ]);

  return {
    reviews,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      pageCount: Math.ceil(total / input.pageSize),
    },
  };
}

export async function moderateReview(
  id: string,
  input: ReviewModerationInput,
  actor: AuthenticatedUser,
) {
  const review = await prisma.review.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
    },
  });

  if (!review) {
    throw notFound("Review not found.");
  }

  return prisma.$transaction(async (transaction) => {
    const updatedReview = await transaction.review.update({
      where: { id },
      data: {
        status: input.status,
        reviewedByUserId: actor.id,
        moderationReason: input.reason,
      },
      select: adminReviewSelect,
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "REVIEW_MODERATION_UPDATE",
        targetType: "review",
        targetId: id,
        metadata: {
          fromStatus: review.status,
          toStatus: input.status,
          reason: input.reason ?? null,
        },
      },
      transaction,
    );

    return updatedReview;
  });
}

export async function countPendingReviews(): Promise<number> {
  return prisma.review.count({
    where: {
      status: ReviewStatus.PENDING,
    },
  });
}

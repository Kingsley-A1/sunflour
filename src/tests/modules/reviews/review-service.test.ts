import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductStatus, ReviewStatus, UserRole } from "@/generated/prisma/enums";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import {
  createPublicReview,
  listApprovedReviews,
  moderateReview,
} from "@/server/modules/reviews/review-service";

const mocks = vi.hoisted(() => ({
  productFindFirst: vi.fn(),
  reviewFindMany: vi.fn(),
  reviewCreate: vi.fn(),
  reviewFindUnique: vi.fn(),
  reviewUpdate: vi.fn(),
  transaction: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    product: {
      findFirst: mocks.productFindFirst,
    },
    review: {
      findMany: mocks.reviewFindMany,
      create: mocks.reviewCreate,
      findUnique: mocks.reviewFindUnique,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/server/modules/audit/audit-service", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

const mockedWriteAuditLog = vi.mocked(writeAuditLog);
const moderator = {
  id: "mod_1",
  email: "manager@example.com",
  name: "Manager",
  image: null,
  role: UserRole.MODERATOR,
};

describe("review service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        review: {
          update: mocks.reviewUpdate,
        },
        auditLog: {
          create: vi.fn(),
        },
      }),
    );
    mockedWriteAuditLog.mockResolvedValue({ id: "audit_1" });
  });

  it("lists only approved public reviews", async () => {
    mocks.reviewFindMany.mockResolvedValueOnce([]);

    await listApprovedReviews({ limit: 20 });

    expect(mocks.reviewFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ReviewStatus.APPROVED,
        }),
      }),
    );
  });

  it("creates public reviews in pending status", async () => {
    mocks.productFindFirst.mockResolvedValueOnce({
      id: "product_1",
      status: ProductStatus.ACTIVE,
    });
    mocks.reviewCreate.mockResolvedValueOnce({
      id: "review_1",
      status: ReviewStatus.PENDING,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const review = await createPublicReview({
      customerName: "Ada Baker",
      rating: 5,
      comment: "Fresh bread and fast pickup service.",
      productId: "product_1",
    });

    expect(review.status).toBe(ReviewStatus.PENDING);
    expect(mocks.reviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ReviewStatus.PENDING,
        }),
      }),
    );
  });

  it("moderates reviews and writes audit logs", async () => {
    mocks.reviewFindUnique.mockResolvedValueOnce({
      id: "review_1",
      status: ReviewStatus.PENDING,
    });
    mocks.reviewUpdate.mockResolvedValueOnce({
      id: "review_1",
      status: ReviewStatus.APPROVED,
      customerNameSnapshot: "Ada Baker",
      rating: 5,
      comment: "Fresh bread and fast pickup service.",
      moderationReason: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      product: null,
      user: null,
      reviewedBy: null,
    });

    const review = await moderateReview(
      "review_1",
      {
        status: ReviewStatus.APPROVED,
      },
      moderator,
    );

    expect(review.status).toBe(ReviewStatus.APPROVED);
    expect(mockedWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "REVIEW_MODERATION_UPDATE",
        metadata: expect.objectContaining({
          fromStatus: ReviewStatus.PENDING,
          toStatus: ReviewStatus.APPROVED,
        }),
      }),
      expect.anything(),
    );
  });
});

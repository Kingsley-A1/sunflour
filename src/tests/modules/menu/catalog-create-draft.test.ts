import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma/enums";
import { productCreateSchema } from "@/server/modules/menu/catalog-schemas";
import { createProduct } from "@/server/modules/menu/catalog-service";

const mocks = vi.hoisted(() => ({
  mediaAssetFindMany: vi.fn(),
  productCreate: vi.fn(),
  productDraftDeleteMany: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: async (callback: (tx: unknown) => unknown) =>
      callback({
        mediaAsset: { findMany: mocks.mediaAssetFindMany },
        product: { create: mocks.productCreate },
        productDraft: { deleteMany: mocks.productDraftDeleteMany },
      }),
  },
}));

vi.mock("@/server/modules/audit/audit-service", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

const actor = {
  id: "admin_1",
  email: "owner@example.com",
  name: "Owner",
  image: null,
  role: UserRole.SUPER_ADMIN,
};

function validInput(extra: Record<string, unknown> = {}) {
  return productCreateSchema.parse({
    categoryId: "category_1",
    name: "Chocolate fudge cake",
    basePrice: 1_500_000,
    images: [{ mediaAssetId: "media_1" }],
    ...extra,
  });
}

describe("createProduct draft cleanup", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.mediaAssetFindMany.mockResolvedValue([{ id: "media_1" }]);
    mocks.productCreate.mockResolvedValue({
      id: "product_1",
      categoryId: "category_1",
      name: "Chocolate fudge cake",
      slug: "chocolate-fudge-cake",
      basePrice: 1_500_000,
      status: "ACTIVE",
      variants: [],
      images: [{ id: "image_1" }],
    });
  });

  it("deletes the actor's draft in the same transaction that creates the product", async () => {
    await createProduct(validInput({ draftId: "draft_1" }), actor);

    expect(mocks.productDraftDeleteMany).toHaveBeenCalledWith({
      where: { id: "draft_1", createdByUserId: actor.id },
    });
    expect(mocks.productCreate.mock.calls[0]?.[0]?.data).not.toHaveProperty("draftId");
  });

  it("does not touch drafts when none was given", async () => {
    await createProduct(validInput(), actor);

    expect(mocks.productDraftDeleteMany).not.toHaveBeenCalled();
  });
});

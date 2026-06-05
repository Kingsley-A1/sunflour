import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma/enums";
import { updateProduct } from "@/server/modules/menu/catalog-service";

const mocks = vi.hoisted(() => ({
  productFindUnique: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    product: {
      findUnique: mocks.productFindUnique,
    },
  },
}));

vi.mock("@/server/modules/audit/audit-service", () => ({
  writeAuditLog: vi.fn(),
}));

const mediaManager = {
  id: "media_1",
  email: "media@example.com",
  name: null,
  image: null,
  role: UserRole.MEDIA_MANAGER,
};

describe("catalog service permissions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("prevents media managers from changing product prices", async () => {
    await expect(
      updateProduct(
        "product_1",
        {
          basePrice: 4500,
        },
        mediaManager,
      ),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
    expect(mocks.productFindUnique).not.toHaveBeenCalled();
  });
});

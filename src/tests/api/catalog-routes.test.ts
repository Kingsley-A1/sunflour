import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductStatus, UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/server/auth/rbac";
import {
  createProduct,
  getPublicMenu,
  getPublicProductBySlug,
  updateProductStatus,
} from "@/server/modules/menu/catalog-service";
import { createPresignedProductImageUpload } from "@/server/modules/media/media-service";
import { GET as getPublicMenuRoute } from "@/app/api/v1/public/menu/route";
import { GET as getPublicProductRoute } from "@/app/api/v1/public/products/[slug]/route";
import { POST as postProductRoute } from "@/app/api/v1/admin/products/route";
import { PATCH as patchProductStatusRoute } from "@/app/api/v1/admin/products/[id]/status/route";
import { POST as postPresignedUploadRoute } from "@/app/api/v1/admin/media/presign-upload/route";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

vi.mock("@/server/auth/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/server/modules/menu/catalog-service", () => ({
  createProduct: vi.fn(),
  getPublicMenu: vi.fn(),
  getPublicProductBySlug: vi.fn(),
  updateProductStatus: vi.fn(),
}));

vi.mock("@/server/modules/media/media-service", () => ({
  createPresignedProductImageUpload: vi.fn(),
}));

const mockedRequireRole = vi.mocked(requireRole);
const mockedCreateProduct = vi.mocked(createProduct);
const mockedGetPublicMenu = vi.mocked(getPublicMenu);
const mockedGetPublicProductBySlug = vi.mocked(getPublicProductBySlug);
const mockedUpdateProductStatus = vi.mocked(updateProductStatus);
const mockedCreatePresignedUpload = vi.mocked(
  createPresignedProductImageUpload,
);

const adminUser = {
  id: "admin_1",
  email: "owner@example.com",
  name: null,
  image: null,
  role: UserRole.SUPER_ADMIN,
};

function jsonRequest(url: string, body: unknown): NextRequest {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  }) as NextRequest;
}

describe("catalog API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedRequireRole.mockResolvedValue(adminUser);
  });

  it("returns the public menu from the catalog service", async () => {
    mockedGetPublicMenu.mockResolvedValueOnce({
      categories: [
        {
          id: "cat_1",
          name: "Cakes",
          slug: "cakes",
          description: null,
          products: [],
        },
      ],
    });

    const response = await getPublicMenuRoute();
    const body = (await response.json()) as ApiSuccess<{
      categories: unknown[];
    }>;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.categories).toHaveLength(1);
  });

  it("returns public product details by slug", async () => {
    mockedGetPublicProductBySlug.mockResolvedValueOnce({
      id: "product_1",
      name: "Cake",
      slug: "cake",
      description: null,
      basePrice: 2500,
      status: ProductStatus.ACTIVE,
      isOrderable: true,
      isFeatured: false,
      isPopular: false,
      sortOrder: 0,
      variants: [],
      images: [],
      category: {
        id: "cat_1",
        name: "Cakes",
        slug: "cakes",
      },
    });

    const response = await getPublicProductRoute(new Request("http://test"), {
      params: Promise.resolve({ slug: "cake" }),
    });
    const body = (await response.json()) as ApiSuccess<{ slug: string }>;

    expect(response.status).toBe(200);
    expect(body.data.slug).toBe("cake");
    expect(mockedGetPublicProductBySlug).toHaveBeenCalledWith("cake");
  });

  it("lets super admins create products", async () => {
    mockedCreateProduct.mockResolvedValueOnce({
      id: "product_1",
      categoryId: "cat_1",
      name: "Cake",
      slug: "cake",
      description: null,
      basePrice: 2500,
      status: ProductStatus.ACTIVE,
      showWhenOutOfStock: true,
      isFeatured: false,
      isPopular: false,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: "cat_1",
        name: "Cakes",
        slug: "cakes",
        description: null,
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      variants: [],
      images: [],
    });

    const response = await postProductRoute(
      jsonRequest("http://test/api/v1/admin/products", {
        categoryId: "cat_1",
        name: "Cake",
        basePrice: 2500,
      }),
    );

    expect(response.status).toBe(201);
    expect(mockedCreateProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "cat_1",
        name: "Cake",
        basePrice: 2500,
      }),
    );
  });

  it("passes moderator product availability updates to the service", async () => {
    const moderator = {
      ...adminUser,
      id: "mod_1",
      role: UserRole.MODERATOR,
    };
    mockedRequireRole.mockResolvedValueOnce(moderator);
    mockedUpdateProductStatus.mockResolvedValueOnce({
      id: "product_1",
      categoryId: "cat_1",
      name: "Cake",
      slug: "cake",
      description: null,
      basePrice: 2500,
      status: ProductStatus.OUT_OF_STOCK,
      showWhenOutOfStock: true,
      isFeatured: false,
      isPopular: false,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: "cat_1",
        name: "Cakes",
        slug: "cakes",
        description: null,
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      variants: [],
      images: [],
    });

    const response = await patchProductStatusRoute(
      jsonRequest("http://test/api/v1/admin/products/product_1/status", {
        status: ProductStatus.OUT_OF_STOCK,
        reason: "Sold out for today",
      }),
      {
        params: Promise.resolve({ id: "product_1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateProductStatus).toHaveBeenCalledWith(
      "product_1",
      expect.objectContaining({
        status: ProductStatus.OUT_OF_STOCK,
      }),
      moderator,
    );
  });

  it("rejects invalid media upload requests before creating signed URLs", async () => {
    const response = await postPresignedUploadRoute(
      jsonRequest("http://test/api/v1/admin/media/presign-upload", {
        fileName: "menu.pdf",
        contentType: "application/pdf",
        byteSize: 1000,
        purpose: "PRODUCT_IMAGE",
      }),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedCreatePresignedUpload).not.toHaveBeenCalled();
  });
});

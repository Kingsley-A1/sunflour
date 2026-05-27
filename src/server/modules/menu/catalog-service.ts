import { MediaAssetStatus, MediaUploadPurpose, ProductStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/server/auth/roles";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import {
  requireSlug,
  type CategoryCreateInput,
  type CategoryUpdateInput,
  type ProductCreateInput,
  type ProductImageCreateInput,
  type ProductStatusUpdateInput,
  type ProductUpdateInput,
  type ProductVariantCreateInput,
  type ProductVariantUpdateInput,
} from "./catalog-schemas";
import { getProductVisibility, publicProductWhere } from "./public-catalog";

const publicProductInclude = {
  variants: {
    where: {
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  },
  images: {
    where: {
      mediaAsset: {
        status: MediaAssetStatus.READY,
      },
    },
    include: {
      mediaAsset: true,
    },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  },
} satisfies Prisma.ProductInclude;

const adminProductInclude = {
  category: true,
  variants: {
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  },
  images: {
    include: {
      mediaAsset: true,
    },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  },
} satisfies Prisma.ProductInclude;

function notFound(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: message,
    status: 404,
  });
}

function forbidden(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.FORBIDDEN,
    publicMessage: message,
    status: 403,
  });
}

function mapPublicImage(
  image: Prisma.ProductImageGetPayload<{
    include: { mediaAsset: true };
  }>,
) {
  return {
    id: image.id,
    url: image.mediaAsset.publicUrl,
    altText: image.altText,
    isPrimary: image.isPrimary,
    sortOrder: image.sortOrder,
  };
}

function mapPublicProduct(
  product: Prisma.ProductGetPayload<{ include: typeof publicProductInclude }>,
) {
  const visibility = getProductVisibility(product);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice,
    status: product.status,
    isOrderable: visibility.isOrderable,
    isFeatured: product.isFeatured,
    isPopular: product.isPopular,
    sortOrder: product.sortOrder,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      sku: variant.sku,
      sortOrder: variant.sortOrder,
    })),
    images: product.images.map(mapPublicImage),
  };
}

export async function getPublicMenu() {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      products: {
        some: publicProductWhere(),
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: publicProductWhere(),
        include: publicProductInclude,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      products: category.products.map(mapPublicProduct),
    })),
  };
}

export async function getPublicProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      category: {
        isActive: true,
      },
      ...publicProductWhere(),
    },
    include: {
      category: true,
      ...publicProductInclude,
    },
  });

  if (!product) {
    throw notFound("Product not found.");
  }

  return {
    ...mapPublicProduct(product),
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
  };
}

export async function listAdminCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createCategory(input: CategoryCreateInput) {
  return prisma.category.create({
    data: {
      ...input,
      slug: requireSlug(input),
    },
  });
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  return prisma.category.update({
    where: { id },
    data: {
      ...input,
      slug:
        input.slug ?? (input.name ? requireSlug({ name: input.name }) : undefined),
    },
  });
}

export async function archiveCategory(id: string) {
  return prisma.category.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
}

export async function listAdminProducts() {
  return prisma.product.findMany({
    include: adminProductInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getAdminProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: adminProductInclude,
  });

  if (!product) {
    throw notFound("Product not found.");
  }

  return product;
}

export async function createProduct(input: ProductCreateInput) {
  return prisma.product.create({
    data: {
      categoryId: input.categoryId,
      name: input.name,
      slug: requireSlug(input),
      description: input.description,
      basePrice: input.basePrice,
      status: input.status,
      showWhenOutOfStock: input.showWhenOutOfStock,
      isFeatured: input.isFeatured,
      isPopular: input.isPopular,
      sortOrder: input.sortOrder,
      variants: input.variants?.length
        ? {
            create: input.variants,
          }
        : undefined,
    },
    include: adminProductInclude,
  });
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
  actor: AuthenticatedUser,
) {
  const before = await prisma.product.findUnique({
    where: { id },
    select: {
      basePrice: true,
      status: true,
    },
  });

  if (!before) {
    throw notFound("Product not found.");
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...input,
      slug:
        input.slug ?? (input.name ? requireSlug({ name: input.name }) : undefined),
    },
    include: adminProductInclude,
  });

  if (input.basePrice !== undefined && input.basePrice !== before.basePrice) {
    await writeAuditLog({
      actorUserId: actor.id,
      action: "PRODUCT_PRICE_UPDATE",
      targetType: "product",
      targetId: id,
      metadata: {
        from: before.basePrice,
        to: input.basePrice,
      },
    });
  }

  return product;
}

export async function archiveProduct(id: string, actor: AuthenticatedUser) {
  return updateProductStatus(
    id,
    {
      status: ProductStatus.HIDDEN,
      reason: "Archived through admin API.",
    },
    actor,
  );
}

export async function createProductVariant(
  productId: string,
  input: ProductVariantCreateInput,
) {
  return prisma.productVariant.create({
    data: {
      ...input,
      productId,
    },
  });
}

export async function updateProductVariant(
  id: string,
  input: ProductVariantUpdateInput,
  actor: AuthenticatedUser,
) {
  const before = await prisma.productVariant.findUnique({
    where: { id },
    select: {
      price: true,
      productId: true,
    },
  });

  if (!before) {
    throw notFound("Product variant not found.");
  }

  const variant = await prisma.productVariant.update({
    where: { id },
    data: input,
  });

  if (input.price !== undefined && input.price !== before.price) {
    await writeAuditLog({
      actorUserId: actor.id,
      action: "PRODUCT_VARIANT_PRICE_UPDATE",
      targetType: "product_variant",
      targetId: id,
      metadata: {
        productId: before.productId,
        from: before.price,
        to: input.price,
      },
    });
  }

  return variant;
}

export async function archiveProductVariant(id: string) {
  return prisma.productVariant.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
}

export async function updateProductStatus(
  productId: string,
  input: ProductStatusUpdateInput,
  actor: AuthenticatedUser,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!product) {
    throw notFound("Product not found.");
  }

  if (actor.role === UserRole.MODERATOR) {
    if (
      product.status === ProductStatus.HIDDEN ||
      (input.status !== ProductStatus.ACTIVE &&
        input.status !== ProductStatus.OUT_OF_STOCK)
    ) {
      throw forbidden("Moderators can only update product availability.");
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      status: input.status,
    },
    include: adminProductInclude,
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "PRODUCT_STATUS_UPDATE",
    targetType: "product",
    targetId: productId,
    metadata: {
      from: product.status,
      to: input.status,
      reason: input.reason ?? null,
    },
  });

  return updatedProduct;
}

export async function attachProductImage(
  productId: string,
  input: ProductImageCreateInput,
  actor: AuthenticatedUser,
) {
  const mediaAsset = await prisma.mediaAsset.findUnique({
    where: { id: input.mediaAssetId },
  });

  if (
    !mediaAsset ||
    mediaAsset.status !== MediaAssetStatus.READY ||
    mediaAsset.uploadPurpose !== MediaUploadPurpose.PRODUCT_IMAGE
  ) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      publicMessage: "Use a completed product image upload.",
      status: 400,
      fieldErrors: {
        mediaAssetId: ["Use a completed product image upload."],
      },
    });
  }

  const productImage = await prisma.$transaction(async (transaction) => {
    if (input.isPrimary) {
      await transaction.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    return transaction.productImage.create({
      data: {
        productId,
        mediaAssetId: input.mediaAssetId,
        altText: input.altText,
        isPrimary: input.isPrimary,
        sortOrder: input.sortOrder,
      },
      include: {
        mediaAsset: true,
      },
    });
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "PRODUCT_IMAGE_CREATE",
    targetType: "product",
    targetId: productId,
    metadata: {
      mediaAssetId: input.mediaAssetId,
    },
  });

  return productImage;
}

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

function enforceProductUpdatePermission(
  input: ProductUpdateInput,
  actor: AuthenticatedUser,
): void {
  if (actor.role !== UserRole.MEDIA_MANAGER) {
    return;
  }

  const allowedFields = new Set([
    "name",
    "slug",
    "description",
    "isFeatured",
    "isPopular",
  ]);
  const restrictedFields = Object.keys(input).filter(
    (field) => !allowedFields.has(field),
  );

  if (restrictedFields.length > 0) {
    throw forbidden(
      "Media managers can update product content and images only.",
    );
  }
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

function buildProductImageAltText(
  productName: string,
  index: number,
  total: number,
): string {
  const name = productName.trim() || "Sunflour Bakery product";

  return total > 1 ? `${name} — view ${index + 1}` : name;
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

export async function listPublicCategoryNavigation() {
  return prisma.category.findMany({
    where: {
      isActive: true,
      products: {
        some: publicProductWhere(),
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
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

export async function createCategory(
  input: CategoryCreateInput,
  actor: AuthenticatedUser,
) {
  return prisma.$transaction(async (transaction) => {
    const category = await transaction.category.create({
      data: {
        ...input,
        slug: requireSlug(input),
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "CATEGORY_CREATE",
        targetType: "category",
        targetId: category.id,
        metadata: {
          before: null,
          after: category,
        },
      },
      transaction,
    );

    return category;
  });
}

export async function updateCategory(
  id: string,
  input: CategoryUpdateInput,
  actor: AuthenticatedUser,
) {
  const before = await prisma.category.findUnique({
    where: { id },
  });

  if (!before) {
    throw notFound("Category not found.");
  }

  return prisma.$transaction(async (transaction) => {
    const category = await transaction.category.update({
      where: { id },
      data: {
        ...input,
        slug:
          input.slug ??
          (input.name ? requireSlug({ name: input.name }) : undefined),
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "CATEGORY_UPDATE",
        targetType: "category",
        targetId: id,
        metadata: {
          before,
          after: category,
        },
      },
      transaction,
    );

    return category;
  });
}

export async function archiveCategory(id: string, actor: AuthenticatedUser) {
  const before = await prisma.category.findUnique({
    where: { id },
  });

  if (!before) {
    throw notFound("Category not found.");
  }

  return prisma.$transaction(async (transaction) => {
    const category = await transaction.category.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "CATEGORY_ARCHIVE",
        targetType: "category",
        targetId: id,
        metadata: {
          before,
          after: category,
        },
      },
      transaction,
    );

    return category;
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

export async function createProduct(
  input: ProductCreateInput,
  actor: AuthenticatedUser,
) {
  return prisma.$transaction(async (transaction) => {
    const mediaAssetIds = input.images.map((image) => image.mediaAssetId);
    const mediaAssets = await transaction.mediaAsset.findMany({
      where: {
        id: { in: mediaAssetIds },
        status: MediaAssetStatus.READY,
        uploadPurpose: MediaUploadPurpose.PRODUCT_IMAGE,
        createdByUserId: actor.id,
      },
      select: { id: true },
    });

    if (mediaAssets.length !== mediaAssetIds.length) {
      throw new AppError({
        code: ERROR_CODES.VALIDATION_ERROR,
        publicMessage: "Use completed product image uploads from this admin session.",
        status: 400,
        fieldErrors: {
          images: ["Use completed product image uploads from this admin session."],
        },
      });
    }

    const product = await transaction.product.create({
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
        images: {
          create: input.images.map((image, index) => ({
            mediaAssetId: image.mediaAssetId,
            altText:
              image.altText ||
              buildProductImageAltText(input.name, index, input.images.length),
            isPrimary: index === 0,
            sortOrder: image.sortOrder ?? index,
          })),
        },
      },
      include: adminProductInclude,
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "PRODUCT_CREATE",
        targetType: "product",
        targetId: product.id,
        metadata: {
          before: null,
          after: {
            id: product.id,
            categoryId: product.categoryId,
            name: product.name,
            slug: product.slug,
            basePrice: product.basePrice,
            status: product.status,
            variantCount: product.variants.length,
            imageCount: product.images.length,
          },
        },
      },
      transaction,
    );

    return product;
  });
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
  actor: AuthenticatedUser,
) {
  enforceProductUpdatePermission(input, actor);

  const before = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      categoryId: true,
      name: true,
      slug: true,
      description: true,
      basePrice: true,
      status: true,
      showWhenOutOfStock: true,
      isFeatured: true,
      isPopular: true,
      sortOrder: true,
    },
  });

  if (!before) {
    throw notFound("Product not found.");
  }

  return prisma.$transaction(async (transaction) => {
    const product = await transaction.product.update({
      where: { id },
      data: {
        ...input,
        slug:
          input.slug ??
          (input.name ? requireSlug({ name: input.name }) : undefined),
      },
      include: adminProductInclude,
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "PRODUCT_UPDATE",
        targetType: "product",
        targetId: id,
        metadata: {
          before,
          after: {
            id: product.id,
            categoryId: product.categoryId,
            name: product.name,
            slug: product.slug,
            description: product.description,
            basePrice: product.basePrice,
            status: product.status,
            showWhenOutOfStock: product.showWhenOutOfStock,
            isFeatured: product.isFeatured,
            isPopular: product.isPopular,
            sortOrder: product.sortOrder,
          },
        },
      },
      transaction,
    );

    if (input.basePrice !== undefined && input.basePrice !== before.basePrice) {
      await writeAuditLog(
        {
          actorUserId: actor.id,
          action: "PRODUCT_PRICE_UPDATE",
          targetType: "product",
          targetId: id,
          metadata: {
            before: {
              basePrice: before.basePrice,
            },
            after: {
              basePrice: input.basePrice,
            },
          },
        },
        transaction,
      );
    }

    return product;
  });
}

export async function archiveProduct(id: string, actor: AuthenticatedUser) {
  const product = await updateProductStatus(
    id,
    {
      status: ProductStatus.HIDDEN,
      reason: "Archived through admin API.",
    },
    actor,
  );

  await writeAuditLog({
    actorUserId: actor.id,
    action: "PRODUCT_ARCHIVE",
    targetType: "product",
    targetId: id,
    metadata: {
      after: {
        status: product.status,
      },
    },
  });

  return product;
}

export async function createProductVariant(
  productId: string,
  input: ProductVariantCreateInput,
  actor: AuthenticatedUser,
) {
  return prisma.$transaction(async (transaction) => {
    const variant = await transaction.productVariant.create({
      data: {
        ...input,
        productId,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "PRODUCT_VARIANT_CREATE",
        targetType: "product_variant",
        targetId: variant.id,
        metadata: {
          before: null,
          after: variant,
        },
      },
      transaction,
    );

    return variant;
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

export async function archiveProductVariant(
  id: string,
  actor: AuthenticatedUser,
) {
  const before = await prisma.productVariant.findUnique({
    where: { id },
  });

  if (!before) {
    throw notFound("Product variant not found.");
  }

  return prisma.$transaction(async (transaction) => {
    const variant = await transaction.productVariant.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "PRODUCT_VARIANT_ARCHIVE",
        targetType: "product_variant",
        targetId: id,
        metadata: {
          before,
          after: variant,
        },
      },
      transaction,
    );

    return variant;
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

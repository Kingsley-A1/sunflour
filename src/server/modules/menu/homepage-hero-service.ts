import {
  MediaAssetStatus,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import type { HomepageHeroProductUpdateInput } from "./catalog-schemas";
import { getProductVisibility } from "./public-catalog";

export const HOMEPAGE_HERO_PRODUCT_LIMIT = 4;

export type HeroProductSource =
  | "ADMIN_SELECTED"
  | "RECENT"
  | "MOST_BOUGHT"
  | "FEATURED_POPULAR"
  | "CATALOG_FALLBACK";

export interface HeroProductCandidate<TProduct extends { id: string }> {
  product: TProduct;
  source: HeroProductSource;
  rank: number;
}

const heroProductInclude = {
  category: true,
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

type HeroProductRecord = Prisma.ProductGetPayload<{
  include: typeof heroProductInclude;
}>;

const adminHeroProductInclude = {
  product: {
    include: {
      category: true,
    },
  },
} satisfies Prisma.HomepageHeroProductInclude;

function activeHeroProductWhere(): Prisma.ProductWhereInput {
  return {
    status: ProductStatus.ACTIVE,
    category: {
      isActive: true,
    },
  };
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

function mapPublicHeroProduct(
  product: HeroProductRecord,
  source: HeroProductSource,
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
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    heroSource: source,
  };
}

export function selectHeroProducts<TProduct extends { id: string }>(
  candidates: Array<HeroProductCandidate<TProduct>>,
  limit = HOMEPAGE_HERO_PRODUCT_LIMIT,
): Array<HeroProductCandidate<TProduct>> {
  const selected: Array<HeroProductCandidate<TProduct>> = [];
  const seenProductIds = new Set<string>();

  for (const candidate of candidates) {
    if (seenProductIds.has(candidate.product.id)) {
      continue;
    }

    selected.push(candidate);
    seenProductIds.add(candidate.product.id);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

async function findHeroProductsByIdsInOrder(
  productIds: string[],
): Promise<HeroProductRecord[]> {
  if (productIds.length === 0) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      ...activeHeroProductWhere(),
    },
    include: heroProductInclude,
  });
  const rankById = new Map(productIds.map((productId, index) => [productId, index]));

  return products.sort(
    (first, second) =>
      (rankById.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
      (rankById.get(second.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

async function getAdminSelectedHeroCandidates(
  take: number,
): Promise<Array<HeroProductCandidate<HeroProductRecord>>> {
  const placements = await prisma.homepageHeroProduct.findMany({
    where: {
      isActive: true,
      product: activeHeroProductWhere(),
    },
    include: {
      product: {
        include: heroProductInclude,
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take,
  });

  return placements.map((placement, index) => ({
    product: placement.product,
    source: "ADMIN_SELECTED",
    rank: index,
  }));
}

async function getOptionalHeroCandidates(
  loader: () => Promise<Array<HeroProductCandidate<HeroProductRecord>>>,
): Promise<Array<HeroProductCandidate<HeroProductRecord>>> {
  try {
    return await loader();
  } catch {
    return [];
  }
}

async function getRecentHeroCandidates(
  take: number,
): Promise<Array<HeroProductCandidate<HeroProductRecord>>> {
  const products = await prisma.product.findMany({
    where: activeHeroProductWhere(),
    include: heroProductInclude,
    orderBy: [{ createdAt: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    take,
  });

  return products.map((product, index) => ({
    product,
    source: "RECENT",
    rank: index,
  }));
}

async function getMostBoughtHeroCandidates(
  take: number,
): Promise<Array<HeroProductCandidate<HeroProductRecord>>> {
  const groupedOrderItems = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: {
        not: null,
      },
      order: {
        paymentStatus: PaymentStatus.CONFIRMED,
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED],
        },
      },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take,
  });
  const productIds = groupedOrderItems
    .map((item) => item.productId)
    .filter((productId): productId is string => Boolean(productId));
  const products = await findHeroProductsByIdsInOrder(productIds);

  return products.map((product, index) => ({
    product,
    source: "MOST_BOUGHT",
    rank: index,
  }));
}

async function getFeaturedPopularHeroCandidates(
  take: number,
): Promise<Array<HeroProductCandidate<HeroProductRecord>>> {
  const products = await prisma.product.findMany({
    where: {
      ...activeHeroProductWhere(),
      OR: [{ isFeatured: true }, { isPopular: true }],
    },
    include: heroProductInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take,
  });

  return products.map((product, index) => ({
    product,
    source: "FEATURED_POPULAR",
    rank: index,
  }));
}

async function getCatalogFallbackHeroCandidates(
  take: number,
): Promise<Array<HeroProductCandidate<HeroProductRecord>>> {
  const products = await prisma.product.findMany({
    where: activeHeroProductWhere(),
    include: heroProductInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take,
  });

  return products.map((product, index) => ({
    product,
    source: "CATALOG_FALLBACK",
    rank: index,
  }));
}

export async function getHomepageHeroProducts(
  limit = HOMEPAGE_HERO_PRODUCT_LIMIT,
) {
  const take = Math.max(limit * 3, limit);
  const [
    adminSelected,
    recent,
    mostBought,
    featuredPopular,
    catalogFallback,
  ] = await Promise.all([
    getOptionalHeroCandidates(() => getAdminSelectedHeroCandidates(limit)),
    getRecentHeroCandidates(take),
    getOptionalHeroCandidates(() => getMostBoughtHeroCandidates(take)),
    getFeaturedPopularHeroCandidates(take),
    getCatalogFallbackHeroCandidates(take),
  ]);
  const selected = selectHeroProducts(
    [
      ...adminSelected,
      // Real product-click tracking does not exist yet, so the most-clicked source
      // is intentionally skipped instead of being faked.
      ...recent,
      ...mostBought,
      ...featuredPopular,
      ...catalogFallback,
    ],
    limit,
  );

  return {
    products: selected.map((candidate) =>
      mapPublicHeroProduct(candidate.product, candidate.source),
    ),
    skippedSources: ["MOST_CLICKED"] as const,
  };
}

export async function listAdminHomepageHeroProducts() {
  return prisma.homepageHeroProduct.findMany({
    include: adminHeroProductInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

function invalidHeroProductsError(): AppError {
  return new AppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    publicMessage:
      "Hero products must be active products from active public categories.",
    status: 400,
    fieldErrors: {
      items: ["Choose active products from active public categories."],
    },
  });
}

function simplifyHeroPlacement(
  placement: Prisma.HomepageHeroProductGetPayload<{
    include: typeof adminHeroProductInclude;
  }>,
) {
  return {
    id: placement.id,
    productId: placement.productId,
    productName: placement.product.name,
    sortOrder: placement.sortOrder,
    isActive: placement.isActive,
  };
}

export async function updateHomepageHeroProducts(
  input: HomepageHeroProductUpdateInput,
  actor: AuthenticatedUser,
) {
  const normalizedItems = input.items.map((item, index) => ({
    productId: item.productId,
    sortOrder: item.sortOrder ?? index,
    isActive: item.isActive ?? true,
  }));
  const productIds = normalizedItems.map((item) => item.productId);

  if (productIds.length > 0) {
    const activeProducts = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        ...activeHeroProductWhere(),
      },
      select: {
        id: true,
      },
    });

    if (activeProducts.length !== productIds.length) {
      throw invalidHeroProductsError();
    }
  }

  return prisma.$transaction(async (transaction) => {
    const before = await transaction.homepageHeroProduct.findMany({
      include: adminHeroProductInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (productIds.length === 0) {
      await transaction.homepageHeroProduct.deleteMany();
    } else {
      await transaction.homepageHeroProduct.deleteMany({
        where: {
          productId: {
            notIn: productIds,
          },
        },
      });
    }

    for (const item of normalizedItems) {
      await transaction.homepageHeroProduct.upsert({
        where: {
          productId: item.productId,
        },
        create: {
          productId: item.productId,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
          updatedByUserId: actor.id,
        },
        update: {
          sortOrder: item.sortOrder,
          isActive: item.isActive,
          updatedByUserId: actor.id,
        },
      });
    }

    const after = await transaction.homepageHeroProduct.findMany({
      include: adminHeroProductInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "HOMEPAGE_HERO_PRODUCTS_UPDATE",
        targetType: "homepage_hero_products",
        targetId: null,
        metadata: {
          before: before.map(simplifyHeroPlacement),
          after: after.map(simplifyHeroPlacement),
        },
      },
      transaction,
    );

    return after;
  });
}

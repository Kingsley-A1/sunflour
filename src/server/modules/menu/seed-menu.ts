import { readFile } from "node:fs/promises";
import { z } from "zod";
import { ProductStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";
import { requireSlug } from "./catalog-schemas";

const seedVariantSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().min(0),
  sku: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const seedProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.number().int().min(0),
  status: z
    .enum([
      ProductStatus.ACTIVE,
      ProductStatus.HIDDEN,
      ProductStatus.OUT_OF_STOCK,
    ])
    .optional(),
  showWhenOutOfStock: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  variants: z.array(seedVariantSchema).optional(),
});

const seedCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  products: z.array(seedProductSchema).optional(),
});

const menuSeedSchema = z.object({
  categories: z.array(seedCategorySchema),
});

export type MenuSeedInput = z.infer<typeof menuSeedSchema>;

export interface MenuSeedResult {
  categories: number;
  products: number;
  variants: number;
}

// The complete set of real Sunflour product categories. This is the single
// source of truth shared by the public product nav and the admin "Choose
// category" selector, so both always match the menu the bakery actually sells.
export const canonicalProductCategories = [
  {
    name: "Cakes",
    slug: "cakes",
    description: "Cakes and celebration bakes.",
    sortOrder: 10,
  },
  {
    name: "Burgers",
    slug: "burgers",
    description: "Chicken, beef, double protein, and Lebanese-style burgers.",
    sortOrder: 20,
  },
  {
    name: "Sandwiches",
    slug: "sandwiches",
    description: "Shawarma, fajita, fries sandwich, and chicken tabouk.",
    sortOrder: 30,
  },
  {
    name: "Protein",
    slug: "protein",
    description: "Peppered fried chicken and filling protein bites.",
    sortOrder: 40,
  },
  {
    name: "Pizza",
    slug: "pizza",
    description: "Regular and special pizzas in four serving sizes.",
    sortOrder: 50,
  },
  {
    name: "Ice Cream",
    slug: "ice-cream",
    description: "Ice cream and cold desserts.",
    sortOrder: 60,
  },
  {
    name: "Pastries",
    slug: "pastries",
    description: "Pies, biscuits, cookies, doughnuts, and mini pizza.",
    sortOrder: 70,
  },
  {
    name: "Chops",
    slug: "chops",
    description: "Party-style small chops and quick snacks.",
    sortOrder: 80,
  },
  {
    name: "Treats",
    slug: "treats",
    description: "Small chops, sweet bites, and bakery treats.",
    sortOrder: 90,
  },
  {
    name: "Others",
    slug: "others",
    description: "Other menu items that do not belong in a primary category.",
    sortOrder: 100,
  },
] as const;

export async function seedCanonicalProductCategories(): Promise<number> {
  for (const categorySeed of canonicalProductCategories) {
    await prisma.category.upsert({
      where: { slug: categorySeed.slug },
      update: {
        name: categorySeed.name,
        description: categorySeed.description,
        sortOrder: categorySeed.sortOrder,
        isActive: true,
      },
      create: {
        name: categorySeed.name,
        slug: categorySeed.slug,
        description: categorySeed.description,
        sortOrder: categorySeed.sortOrder,
        isActive: true,
      },
    });
  }

  return canonicalProductCategories.length;
}

export async function seedInitialMenu(
  seed: MenuSeedInput,
): Promise<MenuSeedResult> {
  const parsedSeed = menuSeedSchema.parse(seed);
  let productCount = 0;
  let variantCount = 0;

  for (const categorySeed of parsedSeed.categories) {
    const categorySlug = requireSlug(categorySeed);
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: {
        name: categorySeed.name,
        description: categorySeed.description,
        sortOrder: categorySeed.sortOrder,
        isActive: categorySeed.isActive,
      },
      create: {
        name: categorySeed.name,
        slug: categorySlug,
        description: categorySeed.description,
        sortOrder: categorySeed.sortOrder,
        isActive: categorySeed.isActive,
      },
    });

    for (const productSeed of categorySeed.products ?? []) {
      const productSlug = requireSlug(productSeed);
      const product = await prisma.product.upsert({
        where: { slug: productSlug },
        update: {
          categoryId: category.id,
          name: productSeed.name,
          description: productSeed.description,
          basePrice: productSeed.basePrice,
          status: productSeed.status,
          showWhenOutOfStock: productSeed.showWhenOutOfStock,
          isFeatured: productSeed.isFeatured,
          isPopular: productSeed.isPopular,
          sortOrder: productSeed.sortOrder,
        },
        create: {
          categoryId: category.id,
          name: productSeed.name,
          slug: productSlug,
          description: productSeed.description,
          basePrice: productSeed.basePrice,
          status: productSeed.status,
          showWhenOutOfStock: productSeed.showWhenOutOfStock,
          isFeatured: productSeed.isFeatured,
          isPopular: productSeed.isPopular,
          sortOrder: productSeed.sortOrder,
        },
      });
      productCount += 1;

      for (const variantSeed of productSeed.variants ?? []) {
        await prisma.productVariant.upsert({
          where: {
            id: `${product.id}:${requireSlug(variantSeed)}`,
          },
          update: {
            name: variantSeed.name,
            price: variantSeed.price,
            sku: variantSeed.sku,
            isActive: variantSeed.isActive,
            sortOrder: variantSeed.sortOrder,
          },
          create: {
            id: `${product.id}:${requireSlug(variantSeed)}`,
            productId: product.id,
            name: variantSeed.name,
            price: variantSeed.price,
            sku: variantSeed.sku,
            isActive: variantSeed.isActive,
            sortOrder: variantSeed.sortOrder,
          },
        });
        variantCount += 1;
      }
    }
  }

  return {
    categories: parsedSeed.categories.length,
    products: productCount,
    variants: variantCount,
  };
}

export async function seedInitialMenuFromFile(
  path: string,
): Promise<MenuSeedResult> {
  const file = await readFile(path, "utf8");
  const seed = JSON.parse(file) as unknown;

  return seedInitialMenu(menuSeedSchema.parse(seed));
}

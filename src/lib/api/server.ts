import { getPublicMenu, getPublicProductBySlug } from "@/server/modules/menu/catalog-service";
import { getPublicInvoice } from "@/server/modules/invoices/invoice-service";
import type {
  AdminCategory,
  AdminProduct,
  InvoiceResponse,
  PublicMenuResponse,
  PublicProduct,
} from "@/types/domain";
import type { Prisma } from "@/generated/prisma/client";
import {
  listAdminCategories,
  listAdminProducts,
  getAdminProduct,
} from "@/server/modules/menu/catalog-service";

export async function getPublicMenuSafe(): Promise<{
  menu: PublicMenuResponse | null;
  error: string | null;
}> {
  try {
    const menu = await getPublicMenu();

    return { menu: menu as PublicMenuResponse, error: null };
  } catch {
    return {
      menu: null,
      error:
        "Menu data is not available yet. Check the database connection and seed data.",
    };
  }
}

export async function getPublicProductSafe(slug: string): Promise<{
  product: (PublicProduct & { category: { id: string; name: string; slug: string } }) | null;
  error: string | null;
}> {
  try {
    const product = await getPublicProductBySlug(slug);

    return {
      product: product as PublicProduct & {
        category: { id: string; name: string; slug: string };
      },
      error: null,
    };
  } catch {
    return {
      product: null,
      error: "This product is not available on the public menu.",
    };
  }
}

function serializeDate(value: Date): string {
  return value.toISOString();
}

export async function getPublicInvoiceSafe(
  orderNumber: string,
  token: string | undefined,
): Promise<{ invoice: InvoiceResponse | null; error: string | null }> {
  try {
    const invoice = await getPublicInvoice(orderNumber, token);

    return {
      invoice: {
        ...invoice,
        generatedAt: serializeDate(invoice.generatedAt),
        createdAt: serializeDate(invoice.createdAt),
      },
      error: null,
    };
  } catch {
    return {
      invoice: null,
      error: "Invoice not found. Use the invoice link returned after checkout.",
    };
  }
}

type AdminProductPayload = Prisma.ProductGetPayload<{
  include: {
    category: true;
    variants: true;
    images: {
      include: {
        mediaAsset: true;
      };
    };
  };
}>;

function mapAdminCategory(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminCategory {
  return {
    ...category,
    createdAt: serializeDate(category.createdAt),
    updatedAt: serializeDate(category.updatedAt),
  };
}

function mapAdminProduct(product: AdminProductPayload): AdminProduct {
  return {
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
    createdAt: serializeDate(product.createdAt),
    updatedAt: serializeDate(product.updatedAt),
    category: mapAdminCategory(product.category),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      productId: variant.productId,
      name: variant.name,
      price: variant.price,
      sku: variant.sku,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder,
    })),
    images: product.images.map((image) => ({
      id: image.id,
      productId: image.productId,
      altText: image.altText,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
      mediaAsset: {
        id: image.mediaAsset.id,
        publicUrl: image.mediaAsset.publicUrl,
        status: image.mediaAsset.status,
        contentType: image.mediaAsset.contentType,
        byteSize: image.mediaAsset.byteSize,
      },
    })),
  };
}

export async function getAdminCatalogSafe(): Promise<{
  products: AdminProduct[];
  categories: AdminCategory[];
  error: string | null;
}> {
  try {
    const [products, categories] = await Promise.all([
      listAdminProducts(),
      listAdminCategories(),
    ]);

    return {
      products: products.map((product) => mapAdminProduct(product)),
      categories: categories.map(mapAdminCategory),
      error: null,
    };
  } catch {
    return {
      products: [],
      categories: [],
      error: "Admin catalog data could not be loaded.",
    };
  }
}

export async function getAdminProductSafe(id: string): Promise<{
  product: AdminProduct | null;
  categories: AdminCategory[];
  error: string | null;
}> {
  try {
    const [product, categories] = await Promise.all([
      getAdminProduct(id),
      listAdminCategories(),
    ]);

    return {
      product: mapAdminProduct(product),
      categories: categories.map(mapAdminCategory),
      error: null,
    };
  } catch {
    return {
      product: null,
      categories: [],
      error: "Product could not be loaded.",
    };
  }
}

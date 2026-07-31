import type { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { getServerEnv } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit";
import type {
  HomepageCarouselSlide,
  PublicProductSale,
} from "@/types/domain";
import {
  homepageCarouselSettingsSchema,
  weeklySaleSettingsSchema,
  type HomepageCarouselSettings,
  type HomepageCarouselUpdateInput,
  type WeeklySaleSettingsValue,
  type WeeklySaleUpdateInput,
} from "./homepage-merchandising-schemas";

export const HOMEPAGE_CAROUSEL_KEY = "homepage_carousel_v1";
export const WEEKLY_SALE_KEY = "weekly_sale_v1";

export const DEFAULT_HOMEPAGE_SLIDES: HomepageCarouselSlide[] = [
  {
    id: "double-protein-burger",
    title: "Double Protein Burger",
    imageUrl: "/Carousel/DB-Burger.png",
    altText: "Double Protein Burger from Sunflour Bakery",
    href: "/menu?view=products&query=burger",
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "fajita-pizza",
    title: "Fajita Pizza",
    imageUrl: "/Carousel/Fajita-Pizza.png",
    altText: "Fajita Pizza from Sunflour Bakery",
    href: "/menu?view=products&query=pizza",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "chicken-pie",
    title: "Chicken Pie",
    imageUrl: "/Carousel/Chicken-Pie.png",
    altText: "Chicken Pie from Sunflour Bakery",
    href: "/menu?view=products&query=pie",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "jamaica-pie",
    title: "Jamaica Pie",
    imageUrl: "/Carousel/Jamaica-Pie.png",
    altText: "Jamaica Pie from Sunflour Bakery",
    href: "/menu?view=products&query=pie",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "lebanese-sandwich",
    title: "Lebanese Sandwich",
    imageUrl: "/Carousel/Lebanese-Sandwich.png",
    altText: "Lebanese Sandwich from Sunflour Bakery",
    href: "/menu?view=products&query=sandwich",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "medium-ice-cream-cup",
    title: "Medium Ice Cream Cup",
    imageUrl: "/Carousel/M-Icecream-cup.png",
    altText: "Medium Ice Cream Cup from Sunflour Bakery",
    href: "/menu?view=products&query=ice%20cream",
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "pepperoni-pizza",
    title: "Pepperoni Pizza",
    imageUrl: "/Carousel/Pepperoni-Pizza.png",
    altText: "Pepperoni Pizza from Sunflour Bakery",
    href: "/menu?view=products&query=pizza",
    isActive: true,
    sortOrder: 6,
  },
  {
    id: "potato-fries-sandwich",
    title: "Potato Fries Sandwich",
    imageUrl: "/Carousel/Potatoes-Sandwitch.png",
    altText: "Potato and fries sandwich from Sunflour Bakery",
    href: "/menu?view=products&query=sandwich",
    isActive: true,
    sortOrder: 7,
  },
  {
    id: "shawarma-burger",
    title: "Shawarma Burger",
    imageUrl: "/Carousel/Shawarma-Burger.png",
    altText: "Shawarma Burger from Sunflour Bakery",
    href: "/menu?view=products&query=shawarma",
    isActive: true,
    sortOrder: 8,
  },
  {
    id: "special-shawarma",
    title: "Special Shawarma",
    imageUrl: "/Carousel/Special-Shawarma.png",
    altText: "Special Shawarma from Sunflour Bakery",
    href: "/menu?view=products&query=shawarma",
    isActive: true,
    sortOrder: 9,
  },
];

function defaultCarousel(): HomepageCarouselSettings {
  return { slides: DEFAULT_HOMEPAGE_SLIDES };
}

function parseCarousel(
  value: Prisma.JsonValue | undefined,
): HomepageCarouselSettings {
  const result = homepageCarouselSettingsSchema.safeParse(value);
  return result.success ? result.data : defaultCarousel();
}

function parseWeeklySale(
  value: Prisma.JsonValue | undefined,
): WeeklySaleSettingsValue | null {
  const result = weeklySaleSettingsSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function getLocalDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isWeeklySaleActive(
  sale: WeeklySaleSettingsValue | null,
  now = new Date(),
  timeZone = getServerEnv().APP_TIME_ZONE,
): sale is WeeklySaleSettingsValue {
  if (!sale?.isActive) {
    return false;
  }

  const dateKey = getLocalDateKey(now, timeZone);
  return dateKey >= sale.weekStart && dateKey <= sale.weekEnd;
}

export function applyWeeklySaleDiscount(
  price: number,
  discountPercent: number,
): number {
  return Math.max(0, Math.round((price * (100 - discountPercent)) / 100));
}

export function buildPublicProductSale(
  basePrice: number,
  sale: WeeklySaleSettingsValue,
): PublicProductSale {
  return {
    discountPercent: sale.discountPercent,
    originalBasePrice: basePrice,
    saleBasePrice: applyWeeklySaleDiscount(basePrice, sale.discountPercent),
    cardImageUrl: sale.cardImageUrl,
    weekStart: sale.weekStart,
    weekEnd: sale.weekEnd,
  };
}

async function getSettingsRecords() {
  return prisma.siteSetting.findMany({
    where: {
      key: { in: [HOMEPAGE_CAROUSEL_KEY, WEEKLY_SALE_KEY] },
    },
    select: {
      key: true,
      value: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getActiveWeeklySale(
  now = new Date(),
): Promise<WeeklySaleSettingsValue | null> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: WEEKLY_SALE_KEY },
    select: { value: true },
  });
  const sale = parseWeeklySale(setting?.value);
  return isWeeklySaleActive(sale, now) ? sale : null;
}

export async function getHomepageMerchandisingForPublic(now = new Date()) {
  const records = await getSettingsRecords();
  const carouselRecord = records.find(
    (record) => record.key === HOMEPAGE_CAROUSEL_KEY,
  );
  const saleRecord = records.find((record) => record.key === WEEKLY_SALE_KEY);
  const carousel = parseCarousel(carouselRecord?.value);
  const weeklySale = parseWeeklySale(saleRecord?.value);
  const slides = carousel.slides
    .filter((slide) => slide.isActive)
    .sort((first, second) => first.sortOrder - second.sortOrder);

  if (!isWeeklySaleActive(weeklySale, now)) {
    return { slides };
  }

  const product = await prisma.product.findUnique({
    where: { id: weeklySale.productId },
    select: { slug: true, name: true, status: true },
  });

  if (!product || product.status !== "ACTIVE") {
    return { slides };
  }

  return {
    slides: [
      {
        id: "weekly-sale",
        title: `${product.name} — this week's sale`,
        imageUrl: weeklySale.bannerImageUrl,
        altText: `${product.name}, this week's Sunflour Bakery sale`,
        href: `/products/${product.slug}`,
        isActive: true,
        sortOrder: -1,
      },
      ...slides,
    ],
  };
}

export async function getHomepageMerchandisingForAdmin() {
  const records = await getSettingsRecords();
  const carouselRecord = records.find(
    (record) => record.key === HOMEPAGE_CAROUSEL_KEY,
  );
  const saleRecord = records.find((record) => record.key === WEEKLY_SALE_KEY);
  const parsedSale = saleRecord ? parseWeeklySale(saleRecord.value) : null;

  return {
    carousel: {
      ...parseCarousel(carouselRecord?.value),
      createdAt: carouselRecord?.createdAt.toISOString() ?? null,
      updatedAt: carouselRecord?.updatedAt.toISOString() ?? null,
    },
    weeklySale: saleRecord && parsedSale
      ? {
          ...parsedSale,
          createdAt: saleRecord.createdAt.toISOString(),
          updatedAt: saleRecord.updatedAt.toISOString(),
        }
      : null,
  };
}

function forbidden(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.FORBIDDEN,
    publicMessage: message,
    status: 403,
  });
}

export async function updateHomepageCarousel(
  input: HomepageCarouselUpdateInput,
  actor: AuthenticatedUser,
) {
  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    actor.role !== UserRole.MEDIA_MANAGER
  ) {
    throw forbidden("Only content admins can update the homepage carousel.");
  }

  return prisma.$transaction(async (transaction) => {
    const before = await transaction.siteSetting.findUnique({
      where: { key: HOMEPAGE_CAROUSEL_KEY },
      select: { value: true },
    });
    const setting = await transaction.siteSetting.upsert({
      where: { key: HOMEPAGE_CAROUSEL_KEY },
      create: { key: HOMEPAGE_CAROUSEL_KEY, value: input.carousel },
      update: { value: input.carousel },
      select: { value: true, createdAt: true, updatedAt: true },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "HOMEPAGE_CAROUSEL_UPDATE",
        targetType: "site_setting",
        targetId: HOMEPAGE_CAROUSEL_KEY,
        metadata: {
          before: before?.value ?? null,
          after: input.carousel,
        },
      },
      transaction,
    );

    return {
      ...parseCarousel(setting.value),
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString(),
    };
  });
}

export async function updateWeeklySale(
  input: WeeklySaleUpdateInput,
  actor: AuthenticatedUser,
) {
  if (actor.role !== UserRole.SUPER_ADMIN) {
    throw forbidden("Only super admins can update the weekly sale.");
  }

  const product = await prisma.product.findUnique({
    where: { id: input.weeklySale.productId },
    select: { id: true, name: true, status: true },
  });

  if (
    input.weeklySale.isActive &&
    (!product || product.status !== "ACTIVE")
  ) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      publicMessage: "Choose an active product for the weekly sale.",
      status: 400,
      fieldErrors: {
        productId: ["Choose an active product for the weekly sale."],
      },
    });
  }

  return prisma.$transaction(async (transaction) => {
    const before = await transaction.siteSetting.findUnique({
      where: { key: WEEKLY_SALE_KEY },
      select: { value: true },
    });
    const setting = await transaction.siteSetting.upsert({
      where: { key: WEEKLY_SALE_KEY },
      create: { key: WEEKLY_SALE_KEY, value: input.weeklySale },
      update: { value: input.weeklySale },
      select: { value: true, createdAt: true, updatedAt: true },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "WEEKLY_SALE_UPDATE",
        targetType: "site_setting",
        targetId: WEEKLY_SALE_KEY,
        metadata: {
          productId: input.weeklySale.productId,
          productName: product?.name ?? null,
          before: before?.value ?? null,
          after: input.weeklySale,
        },
      },
      transaction,
    );

    return {
      ...weeklySaleSettingsSchema.parse(setting.value),
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString(),
    };
  });
}

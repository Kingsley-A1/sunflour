import type { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { getServerEnv } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit";
import type { HomepageCarouselSlide } from "@/types/domain";
import {
  homepageCarouselSettingsSchema,
  weeklyOfferSettingsSchema,
  type HomepageCarouselSettings,
  type HomepageCarouselUpdateInput,
  type WeeklyOfferSettingsValue,
  type WeeklyOfferUpdateInput,
  type WeeklyOfferValue,
} from "./homepage-merchandising-schemas";

export const HOMEPAGE_CAROUSEL_KEY = "homepage_carousel_v1";
export const WEEKLY_OFFERS_KEY = "weekly_offers_v1";

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

function parseWeeklyOffers(
  value: Prisma.JsonValue | undefined,
): WeeklyOfferSettingsValue {
  const result = weeklyOfferSettingsSchema.safeParse(value);
  return result.success ? result.data : { offers: [] };
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

export function isOfferLive(
  offer: WeeklyOfferValue,
  now = new Date(),
  timeZone = getServerEnv().APP_TIME_ZONE,
): boolean {
  if (!offer.isActive) {
    return false;
  }

  const dateKey = getLocalDateKey(now, timeZone);
  return dateKey >= offer.weekStart && dateKey <= offer.weekEnd;
}

/** The single offer running today, if any. */
export function findCurrentOffer(
  offers: WeeklyOfferValue[],
  now = new Date(),
): WeeklyOfferValue | null {
  return offers.find((offer) => isOfferLive(offer, now)) ?? null;
}

/** Active offers that have not started yet, soonest first. */
export function findUpcomingOffers(
  offers: WeeklyOfferValue[],
  now = new Date(),
  timeZone = getServerEnv().APP_TIME_ZONE,
): WeeklyOfferValue[] {
  const today = getLocalDateKey(now, timeZone);

  return offers
    .filter((offer) => offer.isActive && offer.weekStart > today)
    .sort((first, second) => first.weekStart.localeCompare(second.weekStart));
}

/** Offers that have already finished, most recent first. */
export function findPastOffers(
  offers: WeeklyOfferValue[],
  now = new Date(),
  timeZone = getServerEnv().APP_TIME_ZONE,
): WeeklyOfferValue[] {
  const today = getLocalDateKey(now, timeZone);

  return offers
    .filter((offer) => offer.weekEnd < today)
    .sort((first, second) => second.weekStart.localeCompare(first.weekStart));
}

async function getSettingsRecords() {
  return prisma.siteSetting.findMany({
    where: {
      key: { in: [HOMEPAGE_CAROUSEL_KEY, WEEKLY_OFFERS_KEY] },
    },
    select: {
      key: true,
      value: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function readOffers(): Promise<WeeklyOfferValue[]> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: WEEKLY_OFFERS_KEY },
    select: { value: true },
  });

  return parseWeeklyOffers(setting?.value).offers;
}

export interface PublicWeeklyOffer extends WeeklyOfferValue {
  purchaseProductName: string | null;
  purchaseProductSlug: string | null;
}

async function decorateOffers(
  offers: WeeklyOfferValue[],
): Promise<PublicWeeklyOffer[]> {
  if (offers.length === 0) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: { id: { in: offers.map((offer) => offer.purchaseProductId) } },
    select: { id: true, name: true, slug: true },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  return offers.map((offer) => {
    const product = byId.get(offer.purchaseProductId);

    return {
      ...offer,
      purchaseProductName: product?.name ?? null,
      purchaseProductSlug: product?.slug ?? null,
    };
  });
}

/** Offer running today, for the homepage section. */
export async function getCurrentWeeklyOfferForPublic(
  now = new Date(),
): Promise<PublicWeeklyOffer | null> {
  const current = findCurrentOffer(await readOffers(), now);

  if (!current) {
    return null;
  }

  return (await decorateOffers([current]))[0] ?? null;
}

/** Current offer plus upcoming and past offers for the Weekly Offer page. */
export async function getWeeklyOffersForPublic(now = new Date()): Promise<{
  current: PublicWeeklyOffer | null;
  upcoming: PublicWeeklyOffer[];
  past: PublicWeeklyOffer[];
}> {
  const offers = await readOffers();
  const current = findCurrentOffer(offers, now);
  const upcoming = findUpcomingOffers(offers, now);
  const past = findPastOffers(offers, now);
  const decorated = await decorateOffers([
    ...(current ? [current] : []),
    ...upcoming,
    ...past,
  ]);
  const byId = new Map(decorated.map((offer) => [offer.id, offer]));
  const pick = (list: WeeklyOfferValue[]) =>
    list
      .map((offer) => byId.get(offer.id))
      .filter((offer): offer is PublicWeeklyOffer => Boolean(offer));

  return {
    current: current ? byId.get(current.id) ?? null : null,
    upcoming: pick(upcoming),
    past: pick(past),
  };
}

export async function getHomepageMerchandisingForPublic(now = new Date()) {
  const records = await getSettingsRecords();
  const carouselRecord = records.find(
    (record) => record.key === HOMEPAGE_CAROUSEL_KEY,
  );
  const offersRecord = records.find((record) => record.key === WEEKLY_OFFERS_KEY);
  const carousel = parseCarousel(carouselRecord?.value);
  const offers = parseWeeklyOffers(offersRecord?.value).offers;
  const slides = carousel.slides
    .filter((slide) => slide.isActive)
    .sort((first, second) => first.sortOrder - second.sortOrder);
  const current = findCurrentOffer(offers, now);

  if (!current) {
    return { slides };
  }

  return {
    slides: [
      {
        id: "weekly-offer",
        title: current.headline,
        imageUrl: current.bannerImageUrl,
        altText: `${current.headline}, this week's Sunflour Bakery offer`,
        href: "/weekly-offers",
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
  const offersRecord = records.find((record) => record.key === WEEKLY_OFFERS_KEY);

  return {
    carousel: {
      ...parseCarousel(carouselRecord?.value),
      createdAt: carouselRecord?.createdAt.toISOString() ?? null,
      updatedAt: carouselRecord?.updatedAt.toISOString() ?? null,
    },
    weeklyOffers: parseWeeklyOffers(offersRecord?.value).offers,
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

export async function updateWeeklyOffers(
  input: WeeklyOfferUpdateInput,
  actor: AuthenticatedUser,
) {
  if (actor.role !== UserRole.SUPER_ADMIN) {
    throw forbidden("Only super admins can update weekly offers.");
  }

  const offers = input.weeklyOffers.offers;
  const productIds = [...new Set(offers.map((offer) => offer.purchaseProductId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, status: true },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const invalidIndex = offers.findIndex(
    (offer) =>
      offer.isActive && byId.get(offer.purchaseProductId)?.status !== "ACTIVE",
  );

  if (invalidIndex >= 0) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      publicMessage: "Choose an active product for each live weekly offer.",
      status: 400,
      fieldErrors: {
        [`offers.${invalidIndex}.purchaseProductId`]: [
          "Choose an active product for this offer.",
        ],
      },
    });
  }

  return prisma.$transaction(async (transaction) => {
    const before = await transaction.siteSetting.findUnique({
      where: { key: WEEKLY_OFFERS_KEY },
      select: { value: true },
    });
    const setting = await transaction.siteSetting.upsert({
      where: { key: WEEKLY_OFFERS_KEY },
      create: { key: WEEKLY_OFFERS_KEY, value: input.weeklyOffers },
      update: { value: input.weeklyOffers },
      select: { value: true, createdAt: true, updatedAt: true },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "WEEKLY_OFFERS_UPDATE",
        targetType: "site_setting",
        targetId: WEEKLY_OFFERS_KEY,
        metadata: {
          offerCount: offers.length,
          before: before?.value ?? null,
          after: input.weeklyOffers,
        },
      },
      transaction,
    );

    return parseWeeklyOffers(setting.value).offers;
  });
}

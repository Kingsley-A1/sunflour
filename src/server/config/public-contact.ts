import { prisma } from "@/server/db/prisma";

export interface PublicContactConfig {
  phoneNumber: string | null;
  phoneHref: string | null;
  whatsappNumber: string | null;
  whatsappHref: string | null;
  emailAddress: string | null;
  emailHref: string | null;
  instagram: string | null;
  instagramHref: string | null;
  tiktok: string | null;
  tiktokHref: string | null;
  facebook: string | null;
  facebookHref: string | null;
  address: string | null;
  mapsHref: string | null;
  hasAnyContact: boolean;
}

interface DbContactSettings {
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  emailAddress?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  address?: string | null;
}

function readPublicEnv(...keys: string[]): string | null {
  for (const key of keys) {
    const value = normalizePublicEnvValue(process.env[key]);
    if (value && !value.startsWith("<")) return value;
  }
  return null;
}

function normalizePublicEnvValue(value: string | undefined): string | null {
  const normalized = value?.trim().replace(/^["']+|["']+$/g, "").trim();
  return normalized || null;
}

function toPhoneHref(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : null;
}

function toWhatsAppHref(value: string | null): string | null {
  if (!value) return null;
  if (isAbsoluteUrl(value)) return value;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function toEmailHref(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/"/g, "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? `mailto:${normalized}` : null;
}

function toMapsHref(value: string | null): string | null {
  if (!value) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

function toSocialHref(value: string | null, platformBaseUrl: string): string | null {
  if (!value) return null;
  if (isAbsoluteUrl(value)) return value;
  const cleanValue = value.replace(/^@/, "").replace(/^\/+/, "").trim();
  if (!cleanValue) return null;
  if (cleanValue.includes(".")) return `https://${cleanValue}`;
  return `${platformBaseUrl}/${encodeURIComponent(cleanValue)}`;
}

function toTikTokHref(value: string | null): string | null {
  if (!value) return null;
  if (isAbsoluteUrl(value)) return value;
  const cleanValue = value.replace(/^@/, "").replace(/^\/+/, "").trim();
  if (!cleanValue) return null;
  if (cleanValue.includes(".")) return `https://${cleanValue}`;
  return `https://www.tiktok.com/@${encodeURIComponent(cleanValue)}`;
}

function toSocialLabel(value: string | null): string | null {
  if (!value) return null;
  if (!isAbsoluteUrl(value)) return value.startsWith("@") ? value : `@${value}`;
  return value.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function buildConfig(raw: {
  phoneNumber: string | null;
  whatsappNumber: string | null;
  emailAddress: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  address: string | null;
}): PublicContactConfig {
  return {
    phoneNumber: raw.phoneNumber,
    phoneHref: toPhoneHref(raw.phoneNumber),
    whatsappNumber: raw.whatsappNumber,
    whatsappHref: toWhatsAppHref(raw.whatsappNumber),
    emailAddress: raw.emailAddress,
    emailHref: toEmailHref(raw.emailAddress),
    instagram: toSocialLabel(raw.instagram),
    instagramHref: toSocialHref(raw.instagram, "https://instagram.com"),
    tiktok: toSocialLabel(raw.tiktok),
    tiktokHref: toTikTokHref(raw.tiktok),
    facebook: toSocialLabel(raw.facebook),
    facebookHref: toSocialHref(raw.facebook, "https://www.facebook.com"),
    address: raw.address,
    mapsHref: toMapsHref(raw.address),
    hasAnyContact: Boolean(
      raw.phoneNumber || raw.whatsappNumber || raw.emailAddress ||
      raw.instagram || raw.tiktok || raw.facebook || raw.address,
    ),
  };
}

export async function getPublicContactConfig(): Promise<PublicContactConfig> {
  const envRaw = {
    phoneNumber: readPublicEnv("PHONE_NUMBER", "NEXT_PUBLIC_SUNFLOUR_PHONE_NUMBER"),
    whatsappNumber: readPublicEnv("WHATSAPP_NUMBER", "NEXT_PUBLIC_SUNFLOUR_WHATSAPP_NUMBER"),
    emailAddress: readPublicEnv("EMAIL_ADDRESS", "NEXT_PUBLIC_SUNFLOUR_EMAIL_ADDRESS"),
    instagram: readPublicEnv("INSTAGRAM", "NEXT_PUBLIC_SUNFLOUR_INSTAGRAM"),
    tiktok: readPublicEnv("TIKTOK", "NEXT_PUBLIC_SUNFLOUR_TIKTOK"),
    facebook: readPublicEnv("FACEBOOK", "NEXT_PUBLIC_SUNFLOUR_FACEBOOK"),
    address: readPublicEnv("ADDRESS", "ADRESS", "NEXT_PUBLIC_SUNFLOUR_ADDRESS"),
  };

  let dbSettings: DbContactSettings | null = null;
  try {
    const record = await prisma.siteSetting.findUnique({
      where: { key: "contact_settings" },
    });
    if (record?.value && typeof record.value === "object") {
      dbSettings = record.value as DbContactSettings;
    }
  } catch {
    // DB unavailable — fall back to env vars only
  }

  const merged = {
    phoneNumber: dbSettings?.phoneNumber ?? envRaw.phoneNumber,
    whatsappNumber: dbSettings?.whatsappNumber ?? envRaw.whatsappNumber,
    emailAddress: dbSettings?.emailAddress ?? envRaw.emailAddress,
    instagram: dbSettings?.instagram ?? envRaw.instagram,
    tiktok: dbSettings?.tiktok ?? envRaw.tiktok,
    facebook: dbSettings?.facebook ?? envRaw.facebook,
    address: dbSettings?.address ?? envRaw.address,
  };

  return buildConfig(merged);
}

import { cache } from "react";
import { getBusinessSettingsForPublic } from "@/server/modules/settings";

export interface PublicContactConfig {
  businessName: string;
  shortDescription: string | null;
  supportHours: string | null;
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

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ? `mailto:${normalized}`
    : null;
}

function toMapsHref(value: string | null): string | null {
  if (!value) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

function toSocialHref(
  value: string | null,
  platformBaseUrl: string,
): string | null {
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

function buildPublicContactConfig(input: {
  businessName?: string | null;
  shortDescription?: string | null;
  supportHours?: string | null;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  emailAddress?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  address?: string | null;
}): PublicContactConfig {
  const businessName = input.businessName?.trim() || "Sunflour Bakery";
  const shortDescription = normalizePublicEnvValue(input.shortDescription ?? undefined);
  const supportHours = normalizePublicEnvValue(input.supportHours ?? undefined);
  const phoneNumber = normalizePublicEnvValue(input.phoneNumber ?? undefined);
  const whatsappNumber = normalizePublicEnvValue(input.whatsappNumber ?? undefined);
  const emailAddress = normalizePublicEnvValue(input.emailAddress ?? undefined);
  const instagram = normalizePublicEnvValue(input.instagram ?? undefined);
  const tiktok = normalizePublicEnvValue(input.tiktok ?? undefined);
  const facebook = normalizePublicEnvValue(input.facebook ?? undefined);
  const address = normalizePublicEnvValue(input.address ?? undefined);

  return {
    businessName,
    shortDescription,
    supportHours,
    phoneNumber,
    phoneHref: toPhoneHref(phoneNumber),
    whatsappNumber,
    whatsappHref: toWhatsAppHref(whatsappNumber),
    emailAddress,
    emailHref: toEmailHref(emailAddress),
    instagram: toSocialLabel(instagram),
    instagramHref: toSocialHref(instagram, "https://instagram.com"),
    tiktok: toSocialLabel(tiktok),
    tiktokHref: toTikTokHref(tiktok),
    facebook: toSocialLabel(facebook),
    facebookHref: toSocialHref(facebook, "https://www.facebook.com"),
    address,
    mapsHref: toMapsHref(address),
    hasAnyContact: Boolean(
      phoneNumber ||
        whatsappNumber ||
        emailAddress ||
        instagram ||
        tiktok ||
        facebook ||
        address,
    ),
  };
}

export function getPublicContactConfig(): PublicContactConfig {
  const phoneNumber = readPublicEnv("PHONE_NUMBER", "NEXT_PUBLIC_SUNFLOUR_PHONE_NUMBER");
  const whatsappNumber = readPublicEnv(
    "WHATSAPP_NUMBER",
    "NEXT_PUBLIC_SUNFLOUR_WHATSAPP_NUMBER",
  );
  const emailAddress = readPublicEnv(
    "EMAIL_ADDRESS",
    "NEXT_PUBLIC_SUNFLOUR_EMAIL_ADDRESS",
  );
  const instagram = readPublicEnv("INSTAGRAM", "NEXT_PUBLIC_SUNFLOUR_INSTAGRAM");
  const tiktok = readPublicEnv("TIKTOK", "NEXT_PUBLIC_SUNFLOUR_TIKTOK");
  const facebook = readPublicEnv("FACEBOOK", "NEXT_PUBLIC_SUNFLOUR_FACEBOOK");
  const address = readPublicEnv(
    "ADDRESS",
    "ADRESS",
    "NEXT_PUBLIC_SUNFLOUR_ADDRESS",
  );

  return buildPublicContactConfig({
    businessName: "Sunflour Bakery",
    shortDescription: null,
    supportHours: null,
    phoneNumber,
    whatsappNumber,
    emailAddress,
    instagram,
    tiktok,
    facebook,
    address,
  });
}

export const getResolvedPublicContactConfig = cache(
  async (): Promise<PublicContactConfig> => {
    const fallback = getPublicContactConfig();

    try {
      const businessSettings = await getBusinessSettingsForPublic();

      if (!businessSettings) {
        return fallback;
      }

      return buildPublicContactConfig({
        businessName: businessSettings.businessName,
        shortDescription: businessSettings.shortDescription,
        supportHours: businessSettings.supportHours,
        phoneNumber: businessSettings.phoneNumber ?? fallback.phoneNumber,
        whatsappNumber: businessSettings.whatsappNumber ?? fallback.whatsappNumber,
        emailAddress: businessSettings.emailAddress ?? fallback.emailAddress,
        instagram: businessSettings.instagram ?? fallback.instagram,
        tiktok: businessSettings.tiktok ?? fallback.tiktok,
        facebook: businessSettings.facebook ?? fallback.facebook,
        address: businessSettings.address ?? fallback.address,
      });
    } catch {
      return fallback;
    }
  },
);

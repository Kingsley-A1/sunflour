import { z } from "zod";

function blankStringToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function optionalTrimmedString(max: number) {
  return z.preprocess(
    blankStringToNull,
    z.string().trim().max(max).nullable(),
  );
}

const phonePattern = /^\+?[0-9][0-9\s().-]{6,29}$/;

function optionalPhoneString() {
  return z.preprocess(
    blankStringToNull,
    z
      .string()
      .trim()
      .max(30)
      .regex(phonePattern, "Enter a valid phone number.")
      .nullable(),
  );
}

const optionalEmailString = z.preprocess(
  blankStringToNull,
  z.string().trim().email("Enter a valid email address.").max(254).nullable(),
);

export const businessSettingsValueSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(1, "Enter the business name.")
      .max(120),
    shortDescription: optionalTrimmedString(220),
    supportHours: optionalTrimmedString(160),
    phoneNumber: optionalPhoneString(),
    whatsappNumber: optionalPhoneString(),
    emailAddress: optionalEmailString,
    address: optionalTrimmedString(240),
    instagram: optionalTrimmedString(160),
    tiktok: optionalTrimmedString(160),
    facebook: optionalTrimmedString(160),
  })
  .strict();

export const businessSettingsUpdateSchema = businessSettingsValueSchema;

export type BusinessSettingsValue = z.infer<typeof businessSettingsValueSchema>;
export type BusinessSettingsUpdateInput = z.infer<
  typeof businessSettingsUpdateSchema
>;

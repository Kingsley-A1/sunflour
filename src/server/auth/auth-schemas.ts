import { z } from "zod";
import { UserRole } from "@/server/auth/roles";

const fullNameSchema = z.string().trim().min(2).max(120);
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const customerRegistrationSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const credentialsLoginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128),
  })
  .strict();

export const passwordResetRequestSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const passwordResetConfirmSchema = z
  .object({
    email: emailSchema,
    token: z.string().trim().min(32).max(256),
    password: passwordSchema,
  })
  .strict();

export const adminRegistrationRoleSchema = z.enum([
  UserRole.ATTENDANT,
  UserRole.MEDIA_MANAGER,
  UserRole.MODERATOR,
  UserRole.SUPER_ADMIN,
]);

export const adminRegistrationSchema = customerRegistrationSchema
  .extend({
    role: adminRegistrationRoleSchema,
    registrationCode: z.string().trim().regex(/^[0-9]{6}$/, {
      message: "Enter the 6-digit registration code.",
    }),
  })
  .strict();

export type CustomerRegistrationInput = z.infer<
  typeof customerRegistrationSchema
>;
export type CredentialsLoginInput = z.infer<typeof credentialsLoginSchema>;
export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetConfirmInput = z.infer<
  typeof passwordResetConfirmSchema
>;
export type AdminRegistrationInput = z.infer<typeof adminRegistrationSchema>;

import { createHash, randomBytes } from "node:crypto";
import { EmailTemplateKey } from "@/generated/prisma/enums";
import { normalizeEmail } from "@/server/auth/admin-allowlist";
import type {
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
} from "@/server/auth/auth-schemas";
import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { queueEmail } from "@/server/modules/email";

const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const PASSWORD_RESET_IDENTIFIER_PREFIX = "password-reset";

export interface PasswordResetRequestResult {
  queued: boolean;
}

function resetIdentifier(email: string): string {
  return `${PASSWORD_RESET_IDENTIFIER_PREFIX}:${email}`;
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function invalidResetTokenError(): AppError {
  return new AppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    publicMessage: "The password reset link is invalid or expired.",
    status: 400,
    fieldErrors: {
      token: ["The password reset link is invalid or expired."],
    },
  });
}

function buildResetUrl(input: {
  baseUrl: string;
  email: string;
  token: string;
}): string {
  const url = new URL("/reset-password", input.baseUrl);
  url.searchParams.set("email", input.email);
  url.searchParams.set("token", input.token);

  return url.toString();
}

export async function requestPasswordReset(
  input: PasswordResetRequestInput,
  baseUrl: string,
): Promise<PasswordResetRequestResult> {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user?.email || !user.passwordHash) {
    return { queued: false };
  }

  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
  const identifier = resetIdentifier(email);
  const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await prisma.$transaction(async (transaction) => {
    await transaction.verificationToken.deleteMany({
      where: { identifier },
    });
    await transaction.verificationToken.create({
      data: {
        identifier,
        token: hashResetToken(token),
        expires,
      },
    });
  });

  await queueEmail({
    templateKey: EmailTemplateKey.AUTH_PASSWORD_RESET,
    recipientEmail: user.email,
    recipientName: user.name,
    payload: {
      customerName: user.name ?? undefined,
      resetUrl: buildResetUrl({
        baseUrl,
        email,
        token,
      }),
    },
  });

  return { queued: true };
}

export async function confirmPasswordReset(
  input: PasswordResetConfirmInput,
): Promise<void> {
  const email = normalizeEmail(input.email);
  const identifier = resetIdentifier(email);
  const tokenHash = hashResetToken(input.token);
  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier,
      token: tokenHash,
      expires: {
        gt: new Date(),
      },
    },
  });

  if (!token) {
    throw invalidResetTokenError();
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { email },
      data: {
        passwordHash,
        passwordUpdatedAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    await transaction.verificationToken.deleteMany({
      where: { identifier },
    });
  });
}

import { AdminProfileStatus, UserRole } from "@/generated/prisma/enums";
import type { User } from "next-auth";
import { normalizeEmail } from "@/server/auth/admin-allowlist";
import { verifyActiveAdminRegistrationCode } from "@/server/auth/admin-registration-code-service";
import type {
  AdminRegistrationInput,
  CredentialsLoginInput,
  CustomerRegistrationInput,
} from "@/server/auth/auth-schemas";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;
const DUMMY_PASSWORD_HASH =
  "$2b$12$mjxCfX4cKVu7naIuCv8SjOD.zCW7cN5BYDl.jYIWUoN5dDiD7IBei";

export interface SafeAuthUser {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
}

function duplicateEmailError(): AppError {
  return new AppError({
    code: ERROR_CODES.CONFLICT,
    publicMessage: "An account already exists for this email.",
    status: 409,
    fieldErrors: {
      email: ["An account already exists for this email."],
    },
  });
}

function invalidAdminCodeError(): AppError {
  return new AppError({
    code: ERROR_CODES.FORBIDDEN,
    publicMessage: "The admin registration code is invalid or expired.",
    status: 403,
    fieldErrors: {
      registrationCode: ["The admin registration code is invalid or expired."],
    },
  });
}

function mapSafeUser(user: {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
}): SafeAuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function ensureEmailAvailable(email: string): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw duplicateEmailError();
  }
}

export async function registerCustomer(
  input: CustomerRegistrationInput,
): Promise<SafeAuthUser> {
  const email = normalizeEmail(input.email);
  await ensureEmailAvailable(email);

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.fullName,
      email,
      passwordHash,
      passwordUpdatedAt: new Date(),
      role: UserRole.CUSTOMER,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return mapSafeUser(user);
}

export async function registerAdmin(
  input: AdminRegistrationInput,
): Promise<{
  user: SafeAuthUser;
  adminProfile: { role: UserRole; status: AdminProfileStatus };
}> {
  const email = normalizeEmail(input.email);
  await ensureEmailAvailable(email);

  if (
    !(await verifyActiveAdminRegistrationCode({
      role: input.role,
      code: input.registrationCode,
    }))
  ) {
    throw invalidAdminCodeError();
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        name: input.fullName,
        email,
        passwordHash,
        passwordUpdatedAt: new Date(),
        role: input.role,
        adminProfile: {
          create: {
            role: input.role,
            status: AdminProfileStatus.ACTIVE,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminProfile: {
          select: {
            role: true,
            status: true,
          },
        },
      },
    });

    await writeAuditLog(
      {
        actorUserId: null,
        action: "ADMIN_REGISTERED_WITH_CODE",
        targetType: "admin_profile",
        targetId: user.id,
        metadata: {
          email,
          role: input.role,
        },
      },
      transaction,
    );

    return {
      user: mapSafeUser(user),
      adminProfile: user.adminProfile ?? {
        role: input.role,
        status: AdminProfileStatus.ACTIVE,
      },
    };
  });
}

function loginLockUntil(): Date {
  return new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
}

async function recordFailedLogin(userId: string, failedLoginCount: number) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: {
        increment: 1,
      },
      lockedUntil:
        failedLoginCount + 1 >= MAX_FAILED_LOGIN_ATTEMPTS
          ? loginLockUntil()
          : undefined,
    },
  });
}

export async function authorizeCredentials(
  input: CredentialsLoginInput,
): Promise<User | null> {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      passwordHash: true,
      failedLoginCount: true,
      lockedUntil: true,
    },
  });

  if (!user?.passwordHash) {
    await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
    return null;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return null;
  }

  const validPassword = await verifyPassword(input.password, user.passwordHash);

  if (!validPassword) {
    await recordFailedLogin(user.id, user.failedLoginCount);
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };
}

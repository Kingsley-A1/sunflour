import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminProfileStatus, UserRole } from "@/generated/prisma/enums";
import { verifyActiveAdminRegistrationCode } from "@/server/auth/admin-registration-code-service";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  authorizeCredentials,
  registerAdmin,
  registerCustomer,
} from "@/server/auth/registration-service";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/modules/audit/audit-service";

const mocks = vi.hoisted(() => {
  const transaction = {
    user: {
      create: vi.fn(),
    },
  };

  return {
    transaction,
    userFindUnique: vi.fn(),
    userCreate: vi.fn(),
    userUpdate: vi.fn(),
    transactionRunner: vi.fn((callback) => callback(transaction)),
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
    verifyActiveAdminRegistrationCode: vi.fn(),
    writeAuditLog: vi.fn(),
  };
});

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      create: mocks.userCreate,
      update: mocks.userUpdate,
    },
    $transaction: mocks.transactionRunner,
  },
}));

vi.mock("@/server/auth/password", () => ({
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
}));

vi.mock("@/server/auth/admin-registration-code-service", () => ({
  verifyActiveAdminRegistrationCode: mocks.verifyActiveAdminRegistrationCode,
}));

vi.mock("@/server/modules/audit/audit-service", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

const mockedPrisma = vi.mocked(prisma);
const mockedHashPassword = vi.mocked(hashPassword);
const mockedVerifyPassword = vi.mocked(verifyPassword);
const mockedVerifyActiveAdminRegistrationCode = vi.mocked(
  verifyActiveAdminRegistrationCode,
);
const mockedWriteAuditLog = vi.mocked(writeAuditLog);

describe("registration service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transactionRunner.mockImplementation((callback) =>
      callback(mocks.transaction),
    );
  });

  it("registers customers with normalized email, name, and password hash", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null);
    mockedHashPassword.mockResolvedValueOnce("hashed-password");
    mocks.userCreate.mockResolvedValueOnce({
      id: "user_1",
      name: "Ada Customer",
      email: "ada@example.com",
      role: UserRole.CUSTOMER,
    });

    const user = await registerCustomer({
      fullName: "Ada Customer",
      email: " ADA@Example.com ",
      password: "Sunflour123",
    });

    expect(user).toEqual({
      id: "user_1",
      name: "Ada Customer",
      email: "ada@example.com",
      role: UserRole.CUSTOMER,
    });
    expect(mockedPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "ada@example.com",
        name: "Ada Customer",
        passwordHash: "hashed-password",
        role: UserRole.CUSTOMER,
      }),
      select: expect.any(Object),
    });
  });

  it("rejects duplicate customer registration emails", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({ id: "existing_user" });

    await expect(
      registerCustomer({
        fullName: "Ada Customer",
        email: "ada@example.com",
        password: "Sunflour123",
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
    });
    expect(mockedHashPassword).not.toHaveBeenCalled();
  });

  it("creates active admin profiles only with valid role codes", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null);
    mockedVerifyActiveAdminRegistrationCode.mockResolvedValueOnce(true);
    mockedHashPassword.mockResolvedValueOnce("hashed-password");
    mocks.transaction.user.create.mockResolvedValueOnce({
      id: "admin_1",
      name: "Media Manager",
      email: "media@example.com",
      role: UserRole.MEDIA_MANAGER,
      adminProfile: {
        role: UserRole.MEDIA_MANAGER,
        status: AdminProfileStatus.ACTIVE,
      },
    });

    const result = await registerAdmin({
      fullName: "Media Manager",
      email: "Media@Example.com",
      password: "Sunflour123",
      role: UserRole.MEDIA_MANAGER,
      registrationCode: "123456",
    });

    expect(result.adminProfile).toEqual({
      role: UserRole.MEDIA_MANAGER,
      status: AdminProfileStatus.ACTIVE,
    });
    expect(mocks.transaction.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "media@example.com",
          role: UserRole.MEDIA_MANAGER,
          adminProfile: {
            create: {
              role: UserRole.MEDIA_MANAGER,
              status: AdminProfileStatus.ACTIVE,
            },
          },
        }),
      }),
    );
    expect(mockedWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ADMIN_REGISTERED_WITH_CODE",
      }),
      mocks.transaction,
    );
  });

  it("rejects invalid admin registration codes before hashing", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null);
    mockedVerifyActiveAdminRegistrationCode.mockResolvedValueOnce(false);

    await expect(
      registerAdmin({
        fullName: "Manager",
        email: "manager@example.com",
        password: "Sunflour123",
        role: UserRole.MODERATOR,
        registrationCode: "000000",
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
    expect(mockedHashPassword).not.toHaveBeenCalled();
  });

  it("authorizes valid credentials and resets lockout counters", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({
      id: "user_1",
      name: "Ada Customer",
      email: "ada@example.com",
      image: null,
      role: UserRole.CUSTOMER,
      passwordHash: "hashed-password",
      failedLoginCount: 2,
      lockedUntil: null,
    });
    mockedVerifyPassword.mockResolvedValueOnce(true);

    const user = await authorizeCredentials({
      email: "ADA@example.com",
      password: "Sunflour123",
    });

    expect(user).toMatchObject({
      id: "user_1",
      email: "ada@example.com",
      role: UserRole.CUSTOMER,
    });
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: expect.objectContaining({
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: expect.any(Date),
      }),
    });
  });

  it("increments failed login count and locks after five attempts", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({
      id: "user_1",
      name: "Ada Customer",
      email: "ada@example.com",
      image: null,
      role: UserRole.CUSTOMER,
      passwordHash: "hashed-password",
      failedLoginCount: 4,
      lockedUntil: null,
    });
    mockedVerifyPassword.mockResolvedValueOnce(false);

    await expect(
      authorizeCredentials({
        email: "ada@example.com",
        password: "Wrong123",
      }),
    ).resolves.toBeNull();
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        failedLoginCount: {
          increment: 1,
        },
        lockedUntil: expect.any(Date),
      },
    });
  });

  it("runs a dummy password check for unknown users to reduce timing leaks", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null);
    mockedVerifyPassword.mockResolvedValueOnce(false);

    await expect(
      authorizeCredentials({
        email: "missing@example.com",
        password: "Wrong123",
      }),
    ).resolves.toBeNull();
    expect(mockedVerifyPassword).toHaveBeenCalledWith(
      "Wrong123",
      expect.stringMatching(/^\$2[aby]\$/),
    );
  });
});

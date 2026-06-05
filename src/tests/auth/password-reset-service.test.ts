import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailTemplateKey } from "@/generated/prisma/enums";
import { hashPassword } from "@/server/auth/password";
import {
  confirmPasswordReset,
  requestPasswordReset,
} from "@/server/auth/password-reset-service";
import { prisma } from "@/server/db/prisma";
import { queueEmail } from "@/server/modules/email";

const mocks = vi.hoisted(() => {
  const transaction = {
    user: {
      update: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };

  return {
    transaction,
    userFindUnique: vi.fn(),
    verificationTokenFindFirst: vi.fn(),
    transactionRunner: vi.fn((callback) => callback(transaction)),
    hashPassword: vi.fn(),
    queueEmail: vi.fn(),
  };
});

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    verificationToken: {
      findFirst: mocks.verificationTokenFindFirst,
    },
    $transaction: mocks.transactionRunner,
  },
}));

vi.mock("@/server/auth/password", () => ({
  hashPassword: mocks.hashPassword,
}));

vi.mock("@/server/modules/email", () => ({
  queueEmail: mocks.queueEmail,
}));

const mockedPrisma = vi.mocked(prisma);
const mockedHashPassword = vi.mocked(hashPassword);
const mockedQueueEmail = vi.mocked(queueEmail);

describe("password reset service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transactionRunner.mockImplementation((callback) =>
      callback(mocks.transaction),
    );
  });

  it("does not reveal whether an email has an account", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null);

    const result = await requestPasswordReset(
      { email: "missing@example.com" },
      "https://sunflour.example",
    );

    expect(result.queued).toBe(false);
    expect(mockedQueueEmail).not.toHaveBeenCalled();
  });

  it("stores a hashed reset token and queues the password reset email", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({
      id: "user_1",
      name: "Ada Customer",
      email: "ada@example.com",
      passwordHash: "existing-hash",
    });
    mocks.transaction.verificationToken.create.mockResolvedValueOnce({
      identifier: "password-reset:ada@example.com",
    });

    const result = await requestPasswordReset(
      { email: "ADA@example.com" },
      "https://sunflour.example",
    );

    expect(result.queued).toBe(true);
    expect(mocks.transaction.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        identifier: "password-reset:ada@example.com",
        token: expect.stringMatching(/^[a-f0-9]{64}$/),
        expires: expect.any(Date),
      }),
    });
    expect(mockedQueueEmail).toHaveBeenCalledWith({
      templateKey: EmailTemplateKey.AUTH_PASSWORD_RESET,
      recipientEmail: "ada@example.com",
      recipientName: "Ada Customer",
      payload: expect.objectContaining({
        customerName: "Ada Customer",
        resetUrl: expect.stringContaining("/reset-password?email=ada%40example.com"),
      }),
    });
  });

  it("rejects invalid or expired reset tokens", async () => {
    mocks.verificationTokenFindFirst.mockResolvedValueOnce(null);

    await expect(
      confirmPasswordReset({
        email: "ada@example.com",
        token: "invalid-token-that-is-long-enough-for-validation",
        password: "Sunflour123",
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });
    expect(mockedHashPassword).not.toHaveBeenCalled();
  });

  it("updates the password and consumes reset tokens", async () => {
    mocks.verificationTokenFindFirst.mockResolvedValueOnce({
      identifier: "password-reset:ada@example.com",
      token: "hashed-token",
      expires: new Date("2099-01-01T00:00:00.000Z"),
    });
    mockedHashPassword.mockResolvedValueOnce("new-hash");

    await confirmPasswordReset({
      email: "ada@example.com",
      token: "valid-token-that-is-long-enough-for-validation",
      password: "Sunflour123",
    });

    expect(mockedPrisma.$transaction).toHaveBeenCalled();
    expect(mocks.transaction.user.update).toHaveBeenCalledWith({
      where: { email: "ada@example.com" },
      data: expect.objectContaining({
        passwordHash: "new-hash",
        passwordUpdatedAt: expect.any(Date),
        failedLoginCount: 0,
        lockedUntil: null,
      }),
    });
    expect(mocks.transaction.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "password-reset:ada@example.com" },
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminProfileStatus, UserRole } from "@/generated/prisma/enums";
import { applyAdminAllowlistRole } from "@/server/auth/provisioning";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/modules/audit/audit-service";

const mocks = vi.hoisted(() => {
  const transaction = {
    adminProfile: {
      findUnique: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  };

  return {
    transaction,
    transactionRunner: vi.fn((callback) => callback(transaction)),
    writeAuditLog: vi.fn(),
  };
});

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transactionRunner,
  },
}));

vi.mock("@/server/modules/audit/audit-service", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

const mockedPrisma = vi.mocked(prisma);
const mockedWriteAuditLog = vi.mocked(writeAuditLog);
const originalAllowlist = process.env.ADMIN_ALLOWLIST_EMAILS;

describe("admin allowlist provisioning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_ALLOWLIST_EMAILS = "owner@example.com:SUPER_ADMIN";
    mocks.transactionRunner.mockImplementation((callback) =>
      callback(mocks.transaction),
    );
  });

  afterEach(() => {
    process.env.ADMIN_ALLOWLIST_EMAILS = originalAllowlist;
  });

  it("audits allowlist provisioning from system context", async () => {
    mocks.transaction.adminProfile.findUnique.mockResolvedValueOnce(null);
    mocks.transaction.user.update.mockResolvedValueOnce({ id: "user_1" });

    await applyAdminAllowlistRole({
      userId: "user_1",
      email: "owner@example.com",
    });

    expect(mockedPrisma.$transaction).toHaveBeenCalled();
    expect(mocks.transaction.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_1" },
        data: expect.objectContaining({
          role: UserRole.SUPER_ADMIN,
        }),
      }),
    );
    expect(mockedWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: null,
        action: "ADMIN_ALLOWLIST_PROVISIONED",
        metadata: expect.objectContaining({
          source: "ADMIN_ALLOWLIST_EMAILS",
          after: {
            role: UserRole.SUPER_ADMIN,
            status: AdminProfileStatus.ACTIVE,
          },
        }),
      }),
      mocks.transaction,
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MediaAssetStatus,
  MediaUploadPurpose,
  UserRole,
} from "@/generated/prisma/enums";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import { completeMediaAssetUpload } from "@/server/modules/media/media-service";

const mocks = vi.hoisted(() => ({
  mediaAssetFindUnique: vi.fn(),
  mediaAssetUpdate: vi.fn(),
  transaction: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    mediaAsset: {
      findUnique: mocks.mediaAssetFindUnique,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/server/modules/audit/audit-service", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

const mockedWriteAuditLog = vi.mocked(writeAuditLog);

const actor = {
  id: "admin_1",
  email: "owner@example.com",
  name: "Owner",
  image: null,
  role: UserRole.SUPER_ADMIN,
};

const config = {
  accountId: "account",
  accessKeyId: "access",
  secretAccessKey: "secret",
  bucketName: "bucket",
  publicBaseUrl: "https://media.example.com",
  expiresInSeconds: 300,
};

function pendingAsset(overrides = {}) {
  return {
    id: "media_1",
    bucket: "bucket",
    objectKey: "product-images/2026-01-01/cake.webp",
    publicUrl: null,
    originalFilename: "cake.webp",
    contentType: "image/webp",
    byteSize: 120_000,
    uploadPurpose: MediaUploadPurpose.PRODUCT_IMAGE,
    status: MediaAssetStatus.PENDING_UPLOAD,
    createdByUserId: actor.id,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("media service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedWriteAuditLog.mockResolvedValue({ id: "audit_1" });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        mediaAsset: {
          update: mocks.mediaAssetUpdate,
        },
        auditLog: {
          create: vi.fn(),
        },
      }),
    );
  });

  it("marks an upload ready only after R2 metadata matches", async () => {
    const asset = pendingAsset();
    mocks.mediaAssetFindUnique.mockResolvedValueOnce(asset);
    mocks.mediaAssetUpdate.mockResolvedValueOnce({
      ...asset,
      status: MediaAssetStatus.READY,
      publicUrl: "https://media.example.com/product-images/2026-01-01/cake.webp",
    });

    const completed = await completeMediaAssetUpload("media_1", actor, {
      config,
      headObject: vi.fn().mockResolvedValue({
        ContentLength: 120_000,
        ContentType: "image/webp",
      }),
    });

    expect(completed.status).toBe(MediaAssetStatus.READY);
    expect(mocks.mediaAssetUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: MediaAssetStatus.READY,
          publicUrl:
            "https://media.example.com/product-images/2026-01-01/cake.webp",
        }),
      }),
    );
    expect(mockedWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "MEDIA_UPLOAD_COMPLETED",
      }),
      expect.anything(),
    );
  });

  it("keeps upload pending when R2 object is missing", async () => {
    mocks.mediaAssetFindUnique.mockResolvedValueOnce(pendingAsset());

    await expect(
      completeMediaAssetUpload("media_1", actor, {
        config,
        headObject: vi.fn().mockRejectedValue(new Error("Not found")),
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
    });

    expect(mocks.mediaAssetUpdate).not.toHaveBeenCalled();
    expect(mockedWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "MEDIA_UPLOAD_VERIFICATION_FAILED",
      }),
    );
  });

  it("keeps upload pending when R2 metadata differs", async () => {
    mocks.mediaAssetFindUnique.mockResolvedValueOnce(pendingAsset());

    await expect(
      completeMediaAssetUpload("media_1", actor, {
        config,
        headObject: vi.fn().mockResolvedValue({
          ContentLength: 119_000,
          ContentType: "image/png",
        }),
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
    });

    expect(mocks.mediaAssetUpdate).not.toHaveBeenCalled();
    expect(mockedWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          expected: expect.objectContaining({
            byteSize: 120_000,
            contentType: "image/webp",
          }),
        }),
      }),
    );
  });
});

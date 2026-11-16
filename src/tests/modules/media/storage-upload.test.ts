import { beforeEach, describe, expect, it, vi } from "vitest";
import { MediaAssetStatus, UserRole } from "@/generated/prisma/enums";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { storeMediaObject } from "@/server/modules/media/media-service";
import { storageErrorFromUnknown } from "@/server/modules/media/r2-errors";

const mocks = vi.hoisted(() => ({
  mediaAssetCreate: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    mediaAsset: {
      create: mocks.mediaAssetCreate,
    },
  },
}));

vi.mock("@/server/modules/audit/audit-service", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

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

const input = {
  body: new Uint8Array([1, 2, 3]),
  contentType: "image/webp",
  byteSize: 3,
  fileName: "cake.webp",
  purpose: "PRODUCT_IMAGE" as const,
};

function s3Error(name: string, httpStatusCode?: number) {
  return Object.assign(new Error(name), {
    name,
    $metadata: { httpStatusCode },
  });
}

describe("storage error mapping", () => {
  it("reports bad credentials as a storage configuration problem, not the network", () => {
    const error = storageErrorFromUnknown(s3Error("InvalidAccessKeyId", 403));

    expect(error.code).toBe(ERROR_CODES.STORAGE_MISCONFIGURED);
    expect(error.publicMessage).toMatch(/access keys/i);
    expect(error.publicMessage).toMatch(/connection is fine/i);
    expect(error.cause).toEqual({
      name: "InvalidAccessKeyId",
      code: null,
      httpStatus: 403,
    });
  });

  it("reports a missing bucket as a configuration problem", () => {
    expect(storageErrorFromUnknown(s3Error("NoSuchBucket", 404)).code).toBe(
      ERROR_CODES.STORAGE_MISCONFIGURED,
    );
  });

  it("marks storage timeouts and 5xx responses as temporarily unavailable", () => {
    expect(storageErrorFromUnknown(s3Error("TimeoutError")).code).toBe(
      ERROR_CODES.STORAGE_UNAVAILABLE,
    );
    expect(storageErrorFromUnknown(s3Error("InternalError", 500)).status).toBe(503);
    expect(
      storageErrorFromUnknown(Object.assign(new Error("reset"), { code: "ECONNRESET" })).code,
    ).toBe(ERROR_CODES.STORAGE_UNAVAILABLE);
  });

  it("falls back to a storage-specific failure for unknown errors", () => {
    expect(storageErrorFromUnknown(s3Error("BadDigest", 400)).code).toBe(
      ERROR_CODES.STORAGE_UPLOAD_FAILED,
    );
  });
});

describe("storeMediaObject", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.mediaAssetCreate.mockResolvedValue({
      id: "media_1",
      publicUrl: "https://media.example.com/product-images/x.webp",
      status: MediaAssetStatus.READY,
    });
  });

  it("writes the object before recording a READY media asset", async () => {
    const order: string[] = [];
    const putObject = vi.fn(async () => {
      order.push("put");
    });
    mocks.mediaAssetCreate.mockImplementation(async () => {
      order.push("db");
      return { id: "media_1", publicUrl: null, status: MediaAssetStatus.READY };
    });

    await storeMediaObject(input, actor, { config, putObject });

    expect(order).toEqual(["put", "db"]);
    expect(mocks.mediaAssetCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: MediaAssetStatus.READY,
          bucket: "bucket",
          createdByUserId: actor.id,
          publicUrl: expect.stringMatching(/^https:\/\/media\.example\.com\/product-images\//),
        }),
      }),
    );
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "MEDIA_UPLOAD_COMPLETED" }),
    );
  });

  it("leaves no database row behind when storage rejects the upload", async () => {
    const putObject = vi.fn().mockRejectedValue(s3Error("AccessDenied", 403));

    await expect(
      storeMediaObject(input, actor, { config, putObject }),
    ).rejects.toMatchObject({ code: ERROR_CODES.STORAGE_MISCONFIGURED, status: 502 });
    expect(mocks.mediaAssetCreate).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });
});

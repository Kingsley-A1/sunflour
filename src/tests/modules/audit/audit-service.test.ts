import { describe, expect, it, vi } from "vitest";
import {
  buildAuditLogData,
  writeAuditLog,
} from "@/server/modules/audit/audit-service";

describe("audit service", () => {
  it("builds stable audit log data", () => {
    expect(
      buildAuditLogData({
        actorUserId: "admin_1",
        action: "PAYMENT_SETTINGS_ACCESS_VERIFIED",
        targetType: "payment_settings",
        metadata: {
          reason: "test",
        },
      }),
    ).toEqual({
      actorUserId: "admin_1",
      action: "PAYMENT_SETTINGS_ACCESS_VERIFIED",
      targetType: "payment_settings",
      targetId: null,
      metadata: {
        reason: "test",
      },
    });
  });

  it("writes audit logs through an injectable repository", async () => {
    const create = vi.fn().mockResolvedValue({ id: "audit_1" });

    await writeAuditLog(
      {
        actorUserId: "admin_1",
        action: "ADMIN_ALLOWLIST_SEEDED",
        targetType: "admin_profile",
        targetId: "user_1",
      },
      {
        auditLog: {
          create,
        },
      },
    );

    expect(create).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin_1",
        action: "ADMIN_ALLOWLIST_SEEDED",
        targetType: "admin_profile",
        targetId: "user_1",
        metadata: undefined,
      },
    });
  });
});

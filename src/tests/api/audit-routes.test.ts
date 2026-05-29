import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET as listAuditLogs } from "@/app/api/v1/admin/audit-logs/route";
import { requireRole } from "@/server/auth/rbac";
import { UserRole } from "@/server/auth/roles";
import { listAuditLogsForAdmin } from "@/server/modules/audit";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

vi.mock("@/server/auth/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/server/modules/audit", async () => {
  return {
    auditLogListQuerySchema: {
      safeParse: (input: Record<string, string | undefined>) => ({
        success: true,
        data: {
          ...input,
          page: Number(input.page ?? 1),
          pageSize: Number(input.pageSize ?? 25),
        },
      }),
    },
    listAuditLogsForAdmin: vi.fn(),
  };
});

const mockedRequireRole = vi.mocked(requireRole);
const mockedListAuditLogsForAdmin = vi.mocked(listAuditLogsForAdmin);

function forbidden(): AppError {
  return new AppError({
    code: ERROR_CODES.FORBIDDEN,
    publicMessage: "You do not have permission to perform this action.",
    status: 403,
  });
}

describe("audit log API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requires super admin access", async () => {
    mockedRequireRole.mockRejectedValueOnce(forbidden());

    const response = await listAuditLogs(
      new Request("https://sunflour.test/api/v1/admin/audit-logs"),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(403);
    expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(mockedListAuditLogsForAdmin).not.toHaveBeenCalled();
  });

  it("returns filtered audit logs for super admins", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      id: "super_1",
      email: "owner@example.com",
      name: null,
      image: null,
      role: UserRole.SUPER_ADMIN,
    });
    mockedListAuditLogsForAdmin.mockResolvedValueOnce({
      auditLogs: [],
      pagination: {
        page: 1,
        pageSize: 25,
        total: 0,
        pageCount: 0,
      },
    });

    const response = await listAuditLogs(
      new Request(
        "https://sunflour.test/api/v1/admin/audit-logs?action=PRODUCT_CREATE",
      ),
    );
    const body = (await response.json()) as ApiSuccess<{
      auditLogs: unknown[];
    }>;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockedListAuditLogsForAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PRODUCT_CREATE",
        page: 1,
        pageSize: 25,
      }),
    );
  });
});

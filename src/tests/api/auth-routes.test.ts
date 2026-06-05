import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma/enums";
import { POST as postAdminRegisterRoute } from "@/app/api/v1/public/auth/admin-register/route";
import { POST as postRegisterRoute } from "@/app/api/v1/public/auth/register/route";
import {
  registerAdmin,
  registerCustomer,
} from "@/server/auth/registration-service";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";
import { clearRateLimitBuckets } from "@/server/lib/rate-limit";

vi.mock("@/server/auth/registration-service", () => ({
  registerAdmin: vi.fn(),
  registerCustomer: vi.fn(),
}));

const mockedRegisterAdmin = vi.mocked(registerAdmin);
const mockedRegisterCustomer = vi.mocked(registerCustomer);

function jsonRequest(url: string, body: unknown): NextRequest {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.8",
    },
  }) as NextRequest;
}

describe("public auth API routes", () => {
  beforeEach(() => {
    clearRateLimitBuckets();
    vi.resetAllMocks();
  });

  it("registers a customer and returns a safe user summary", async () => {
    mockedRegisterCustomer.mockResolvedValueOnce({
      id: "user_1",
      name: "Ada Customer",
      email: "ada@example.com",
      role: UserRole.CUSTOMER,
    });

    const response = await postRegisterRoute(
      jsonRequest("http://test/api/v1/public/auth/register", {
        fullName: "Ada Customer",
        email: "ada@example.com",
        password: "Sunflour123",
      }),
    );
    const body = (await response.json()) as ApiSuccess<{
      user: { role: UserRole; passwordHash?: string };
    }>;

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.user.role).toBe(UserRole.CUSTOMER);
    expect(body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects weak public registration before service calls", async () => {
    const response = await postRegisterRoute(
      jsonRequest("http://test/api/v1/public/auth/register", {
        fullName: "Ada Customer",
        email: "ada@example.com",
        password: "weak",
      }),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedRegisterCustomer).not.toHaveBeenCalled();
  });

  it("registers admins only through the gated admin registration route", async () => {
    mockedRegisterAdmin.mockResolvedValueOnce({
      user: {
        id: "admin_1",
        name: "Media Manager",
        email: "media@example.com",
        role: UserRole.MEDIA_MANAGER,
      },
      adminProfile: {
        role: UserRole.MEDIA_MANAGER,
        status: "ACTIVE",
      },
    });

    const response = await postAdminRegisterRoute(
      jsonRequest("http://test/api/v1/public/auth/admin-register", {
        fullName: "Media Manager",
        email: "media@example.com",
        password: "Sunflour123",
        role: "MEDIA_MANAGER",
        registrationCode: "123456",
      }),
    );
    const body = (await response.json()) as ApiSuccess<{
      adminProfile: { role: UserRole };
    }>;

    expect(response.status).toBe(201);
    expect(body.data.adminProfile.role).toBe(UserRole.MEDIA_MANAGER);
    expect(mockedRegisterAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        role: UserRole.MEDIA_MANAGER,
        registrationCode: "123456",
      }),
    );
  });
});

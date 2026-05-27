import type { Session } from "next-auth";
import { describe, expect, it } from "vitest";
import { AdminProfileStatus } from "@/generated/prisma/enums";
import { ADMIN_ROLES, SUPER_ADMIN_ROLES, UserRole } from "@/server/auth/roles";
import { requireAuth, requireRole } from "@/server/auth/rbac";

function sessionFor(role: UserRole, userId = "user_1"): Session {
  return {
    expires: "2099-01-01T00:00:00.000Z",
    user: {
      id: userId,
      role,
      email: `${userId}@example.com`,
      name: null,
      image: null,
    },
  };
}

describe("RBAC helpers", () => {
  it("rejects unauthenticated requests", async () => {
    await expect(
      requireAuth({
        getSession: async () => null,
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("rejects customers from admin roles", async () => {
    await expect(
      requireRole(ADMIN_ROLES, {
        getSession: async () => sessionFor(UserRole.CUSTOMER),
        getAdminAuthorization: async () => null,
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("uses active admin profiles as the server-side role source", async () => {
    const user = await requireRole(ADMIN_ROLES, {
      getSession: async () => sessionFor(UserRole.CUSTOMER, "new_admin_1"),
      getAdminAuthorization: async () => ({
        role: UserRole.SUPER_ADMIN,
        status: AdminProfileStatus.ACTIVE,
      }),
    });

    expect(user.id).toBe("new_admin_1");
    expect(user.role).toBe(UserRole.SUPER_ADMIN);
  });

  it("allows moderators with an active admin profile", async () => {
    const user = await requireRole(ADMIN_ROLES, {
      getSession: async () => sessionFor(UserRole.MODERATOR, "mod_1"),
      getAdminAuthorization: async () => ({
        role: UserRole.MODERATOR,
        status: AdminProfileStatus.ACTIVE,
      }),
    });

    expect(user.id).toBe("mod_1");
    expect(user.role).toBe(UserRole.MODERATOR);
  });

  it("rejects moderators from super admin actions", async () => {
    await expect(
      requireRole(SUPER_ADMIN_ROLES, {
        getSession: async () => sessionFor(UserRole.MODERATOR),
        getAdminAuthorization: async () => ({
          role: UserRole.MODERATOR,
          status: AdminProfileStatus.ACTIVE,
        }),
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("allows super admins with an active admin profile", async () => {
    const user = await requireRole(SUPER_ADMIN_ROLES, {
      getSession: async () => sessionFor(UserRole.SUPER_ADMIN, "super_1"),
      getAdminAuthorization: async () => ({
        role: UserRole.SUPER_ADMIN,
        status: AdminProfileStatus.ACTIVE,
      }),
    });

    expect(user.id).toBe("super_1");
    expect(user.role).toBe(UserRole.SUPER_ADMIN);
  });

  it("rejects inactive admin profiles even when the session has an admin role", async () => {
    await expect(
      requireRole(ADMIN_ROLES, {
        getSession: async () => sessionFor(UserRole.MODERATOR),
        getAdminAuthorization: async () => ({
          role: UserRole.MODERATOR,
          status: AdminProfileStatus.SUSPENDED,
        }),
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });
});

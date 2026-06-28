import { AdminRegistrationCodesClient } from "@/components/admin/admin-registration-codes-client";
import { AdminUsersManagementClient } from "@/components/admin/admin-users-management-client";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import {
  listAdminUsersForSuperAdmin,
  listCustomerUsersForSuperAdmin,
} from "@/server/modules/admin/admin-users-service";
import type {
  AdminUserAccount,
  CustomerUserAccount,
} from "@/lib/api/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Users",
};

export default async function AdminUsersPage() {
  const actor = await requireRole(SUPER_ADMIN_ROLES);
  const [adminProfiles, customers] = await Promise.all([
    listAdminUsersForSuperAdmin(),
    listCustomerUsersForSuperAdmin(),
  ]);

  const adminUsers: AdminUserAccount[] = adminProfiles.map((profile) => ({
    id: profile.id,
    role: profile.role,
    status: profile.status,
    user: {
      id: profile.user.id,
      name: profile.user.name,
      email: profile.user.email,
      role: profile.user.role,
      lastLoginAt: profile.user.lastLoginAt?.toISOString() ?? null,
      lockedUntil: profile.user.lockedUntil?.toISOString() ?? null,
    },
  }));

  const customerUsers: CustomerUserAccount[] = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    lastLoginAt: customer.lastLoginAt?.toISOString() ?? null,
    lockedUntil: customer.lockedUntil?.toISOString() ?? null,
    createdAt: customer.createdAt.toISOString(),
  }));

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Super-admin
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Admin users</h1>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Manage staff and customer accounts, suspend or remove access, and
          regenerate role-scoped registration codes. Account actions are
          audited and notify the person by email.
        </p>
      </header>

      <AdminRegistrationCodesClient />

      <AdminUsersManagementClient
        currentUserId={actor.id}
        initialAdminUsers={adminUsers}
        initialCustomerUsers={customerUsers}
      />
    </div>
  );
}

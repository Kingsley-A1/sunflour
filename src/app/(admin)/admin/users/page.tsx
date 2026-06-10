import { AdminRegistrationCodesClient } from "@/components/admin/admin-registration-codes-client";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { listAdminUsersForSuperAdmin } from "@/server/modules/admin/admin-users-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Users",
};

function formatDateTime(value: Date | null): string {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminUsersPage() {
  await requireRole(SUPER_ADMIN_ROLES);
  const adminUsers = await listAdminUsersForSuperAdmin();

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Super-admin
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Admin users</h1>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Review active staff access and regenerate role-scoped registration
          codes without changing deployment environment secrets.
        </p>
      </header>

      <AdminRegistrationCodesClient />

      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold">Staff accounts</h2>
          <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            Admin permissions are enforced server-side from active admin
            profiles. Suspended profiles cannot use admin routes.
          </p>
        </div>

        {adminUsers.length > 0 ? (
          <div className="grid gap-3">
            {adminUsers.map((adminUser) => (
              <article
                className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]"
                key={adminUser.id}
              >
                <div>
                  <h3 className="m-0 text-base font-bold">
                    {adminUser.user.name ?? "Unnamed admin"}
                  </h3>
                  <p className="m-0 mt-1 break-all text-sm text-[var(--color-text-muted)]">
                    {adminUser.user.email ?? "No email on file"}
                  </p>
                </div>
                <div>
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Role
                  </p>
                  <p className="m-0 mt-1 text-sm font-semibold">
                    {adminUser.role.replaceAll("_", " ").toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Status
                  </p>
                  <p className="m-0 mt-1 text-sm font-semibold">
                    {adminUser.status.toLowerCase()}
                  </p>
                  <p className="m-0 mt-1 text-xs text-[var(--color-text-muted)]">
                    Last login: {formatDateTime(adminUser.user.lastLoginAt)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-soft)] p-3 text-sm text-[var(--color-text-muted)]">
            No admin profiles exist yet.
          </p>
        )}
      </section>
    </div>
  );
}

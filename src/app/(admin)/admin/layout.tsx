import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { requireRole } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  if (!user) {
    return (
      <main className="grid min-h-svh place-items-center bg-[var(--color-bg)] p-4">
        <div className="w-full max-w-lg">
          <h1 className="sr-only">Admin access required</h1>
          <ErrorState
            action={
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
                href="/api/auth/signin"
                style={{ color: "var(--color-on-primary)" }}
              >
                Sign in
              </Link>
            }
            description="Sign in with an active Sunflour admin account to use the operations dashboard."
            title="Admin access required"
          />
        </div>
      </main>
    );
  }

  return <AdminShell role={user.role}>{children}</AdminShell>;
}

async function getAdminUser() {
  try {
    return await requireRole(ADMIN_ROLES);
  } catch {
    return null;
  }
}

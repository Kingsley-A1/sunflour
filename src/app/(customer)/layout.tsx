import { PublicShell } from "@/components/layout/public-shell";
import { getPublicCategoryNavigationSafe } from "@/lib/api/server";
import { getOptionalAuth } from "@/server/auth/rbac";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, user] = await Promise.all([
    getPublicCategoryNavigationSafe(),
    getOptionalAuth(),
  ]);

  return (
    <PublicShell categories={categories} isSignedIn={Boolean(user)}>
      {children}
    </PublicShell>
  );
}

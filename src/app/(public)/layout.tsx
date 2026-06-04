import { PublicShell } from "@/components/layout/public-shell";
import { getPublicCategoryNavigationSafe } from "@/lib/api/server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getPublicCategoryNavigationSafe();

  return <PublicShell categories={categories}>{children}</PublicShell>;
}

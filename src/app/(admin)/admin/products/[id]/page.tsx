import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import { getAdminProductSafe } from "@/lib/api/server";
import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Product",
};

interface AdminProductEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductEditPage({
  params,
}: AdminProductEditPageProps) {
  const user = await requireRole(PRODUCT_CONTENT_ROLES);
  const { id } = await params;
  const { product, categories } = await getAdminProductSafe(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="grid gap-5">
      <header>
        <Link
          className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          href="/admin/products"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Products
        </Link>
        <h1 className="m-0 mt-1 text-2xl font-extrabold sm:text-3xl">{product.name}</h1>
      </header>
      <ProductEditorForm categories={categories} product={product} role={user.role} />
    </div>
  );
}

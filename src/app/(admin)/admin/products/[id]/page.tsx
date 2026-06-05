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
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Catalog</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Edit product</h1>
      </header>
      <ProductEditorForm categories={categories} product={product} role={user.role} />
    </div>
  );
}

import { revalidatePath } from "next/cache";

function safeRevalidatePath(path: string, type?: "layout" | "page") {
  try {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  } catch {
    // Revalidation is unavailable in isolated unit tests. Runtime route handlers
    // still perform cache invalidation when Next.js provides the store.
  }
}

export function revalidateCatalogViews(productSlug?: string) {
  safeRevalidatePath("/", "layout");
  safeRevalidatePath("/menu");
  safeRevalidatePath("/admin/products");
  safeRevalidatePath("/products/[slug]", "page");

  if (productSlug) {
    safeRevalidatePath(`/products/${productSlug}`);
  }
}

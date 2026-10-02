import { MenuBoardsManagerClient } from "@/components/admin/menu-boards-manager-client";
import { requireRole } from "@/server/auth/rbac";
import { PRODUCT_CONTENT_ROLES } from "@/server/auth/roles";
import { getMenuBoardsForAdmin } from "@/server/modules/menu";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Menu boards",
};

export default async function AdminMenuBoardsPage() {
  await requireRole(PRODUCT_CONTENT_ROLES);
  const { boards } = await getMenuBoardsForAdmin();

  return (
    <div className="grid gap-6">
      <header className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
        <div>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
            Menu content
          </p>
          <h1 className="m-0 mt-2 text-3xl font-extrabold">Menu boards</h1>
          <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Upload the printed-style menu images customers see on the public
            Menu page. Upload as many as you need, for example a main menu plus
            separate pizza or dessert menus. When a menu changes, replace its
            image here.
          </p>
        </div>
      </header>

      <MenuBoardsManagerClient initialBoards={boards} />
    </div>
  );
}

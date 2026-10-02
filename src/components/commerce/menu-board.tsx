import type { MenuBoard as MenuBoardData } from "@/types/domain";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MenuBoardCard } from "./menu-board-card";

interface MenuBoardProps {
  boards: MenuBoardData[];
}

// The first board is the main menu: full width on mobile (and centred on
// wider screens). Every other board sits underneath it. The grid reacts to the
// width of this section (container query) rather than to the viewport, so it
// stays correct however the page shell is laid out.
export function MenuBoard({ boards }: MenuBoardProps) {
  const [main, ...others] = boards;

  if (!main) {
    return (
      <p className="m-0 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-6 text-sm text-[var(--color-text-muted)]">
        The menu images are being updated. Browse our products instead.
      </p>
    );
  }

  return (
    <section aria-label="Menus" className="@container mx-auto grid w-full max-w-5xl gap-6">
      <div className="mx-auto w-full @3xl:max-w-2xl">
        <MenuBoardCard board={main} isMain />
      </div>

      {others.length > 0 ? (
        <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
          {others.map((board) => (
            <MenuBoardCard board={board} key={board.id} />
          ))}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
          href="/menu?view=products"
        >
          Order from products
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import menuBoardAsset from "../../../public/full-menu.jpg";

export function MenuBoard() {
  return (
    <section aria-label="Full menu" className="grid gap-4">
      <div className="mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-raised)]">
          <Image
            alt="Sunflour Bakery full menu — cakes, burgers, sandwiches, ice cream, pizza, pastries and chops with prices"
            className="h-auto w-full"
            placeholder="blur"
            priority
            sizes="(min-width: 768px) 42rem, 100vw"
            src={menuBoardAsset}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
            href="/full-menu.jpg"
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open full-size menu
          </a>
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
            href="/menu?view=products"
          >
            Order from products
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

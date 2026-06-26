"use client";

import { useEffect, useState } from "react";
import { HeartHandshake, Leaf, PackageCheck, Truck } from "lucide-react";

const CARDS = [
  {
    Icon: Leaf,
    title: "Fresh from the bakery",
    body: "Bakes are presented as food first, with clear names and prices.",
  },
  {
    Icon: HeartHandshake,
    title: "Warm service",
    body: "Ordering stays simple for guests, families, and returning customers.",
  },
  {
    Icon: Truck,
    title: "Pickup or delivery",
    body: "Choose the fulfilment option that fits your day before checkout.",
  },
  {
    Icon: PackageCheck,
    title: "Prepared with care",
    body: "Portions, availability, and payment state are kept honest.",
  },
];

export function FeatureCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((n) => (n + 1) % CARDS.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {CARDS.map(({ Icon, title, body }) => (
          <article
            key={title}
            className="min-w-full px-8 py-10 text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <Icon className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
            </div>
            <h2 className="m-0 text-xl font-bold">{title}</h2>
            <p className="mx-auto m-0 mt-2 max-w-sm text-sm leading-7 text-[var(--color-text-muted)]">
              {body}
            </p>
          </article>
        ))}
      </div>
      <div className="flex justify-center gap-2 pb-5">
        {CARDS.map((card, i) => (
          <button
            key={card.title}
            type="button"
            aria-label={`Show: ${card.title}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-8 bg-[var(--color-primary)]" : "w-2 bg-[var(--color-border)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

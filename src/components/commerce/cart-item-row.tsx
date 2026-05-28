"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { PriceText } from "@/components/ui/price-text";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import type { CartItem } from "@/features/cart/cart-store";

interface CartItemRowProps {
  item: CartItem;
  itemKey: string;
  onQuantityChange: (value: number) => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  itemKey,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  return (
    <article className="grid grid-cols-[72px_1fr] gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:grid-cols-[88px_1fr_auto]">
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-soft)]">
        {item.imageUrl ? (
          <Image
            alt={item.name}
            className="object-cover"
            fill
            sizes="88px"
            src={item.imageUrl}
          />
        ) : (
          <div className="grid h-full place-items-center text-xs font-semibold text-[var(--color-text-muted)]">
            Sunflour
          </div>
        )}
      </div>
      <div className="grid min-w-0 gap-2">
        <div className="min-w-0">
          <Link className="font-bold hover:underline" href={`/products/${item.slug}`}>
            {item.name}
          </Link>
          {item.variantName ? (
            <p className="m-0 text-sm text-[var(--color-text-muted)]">{item.variantName}</p>
          ) : null}
          <p className="m-0 text-sm text-[var(--color-text-muted)]">
            <PriceText amount={item.unitPrice} /> each
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QuantityStepper
            label={`Quantity for ${item.name}`}
            onChange={onQuantityChange}
            value={item.quantity}
          />
          <IconButton
            icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
            label={`Remove ${item.name}`}
            onClick={onRemove}
          />
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-between border-t border-[var(--color-border)] pt-3 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
        <span className="text-sm text-[var(--color-text-muted)]">Line estimate</span>
        <PriceText amount={item.unitPrice * item.quantity} className="text-lg" />
      </div>
      <span className="sr-only">{itemKey}</span>
    </article>
  );
}

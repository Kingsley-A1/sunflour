"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  archiveAdminProductVariant,
  createAdminProductVariant,
  getApiErrorMessage,
  updateAdminProductVariant,
} from "@/lib/api/client";
import { koboToNairaInput, nairaInputToKobo } from "@/lib/formatters";
import type { AdminProductVariant } from "@/types/domain";

interface ProductVariantsEditorProps {
  productId: string;
  variants: AdminProductVariant[];
  canEdit: boolean;
}

const SIZE_PRESETS = ["Small", "Medium", "Big", "Family"];

/**
 * Sizes or options with their own price (e.g. pizza sizes). When a product has
 * any, customers must pick one and pay its price; the base price is ignored.
 */
export function ProductVariantsEditor({ productId, variants, canEdit }: ProductVariantsEditorProps) {
  const router = useRouter();
  const active = variants.filter((variant) => variant.isActive);
  const [edits, setEdits] = useState<Record<string, { name: string; price: string }>>({});
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function rowValue(variant: AdminProductVariant) {
    return edits[variant.id] ?? { name: variant.name, price: koboToNairaInput(variant.price) };
  }

  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);

    try {
      await action();
      setMessage(success);
      router.refresh();
      return true;
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "The size could not be saved."));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function addVariant(name = newName) {
    const price = nairaInputToKobo(newPrice);

    if (!name.trim()) {
      setError("Enter a size or option name, e.g. Small.");
      return;
    }

    if (price <= 0) {
      setError(`Enter a price for ${name.trim()}.`);
      return;
    }

    const added = await run(
      "new",
      () =>
        createAdminProductVariant(productId, {
          name: name.trim(),
          price,
          sortOrder: active.length,
        }),
      `${name.trim()} added.`,
    );

    if (added) {
      setNewName("");
      setNewPrice("");
    }
  }

  const unusedPresets = SIZE_PRESETS.filter(
    (preset) => !active.some((variant) => variant.name.toLowerCase() === preset.toLowerCase()),
  );

  return (
    <section
      aria-labelledby="product-sizes-heading"
      className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <div>
        <h2 className="m-0 text-lg font-bold" id="product-sizes-heading">
          Sizes and options
        </h2>
        <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
          For items sold in sizes, like pizza. Customers must pick one and pay
          its price. Leave empty for single-price items.
        </p>
      </div>

      {error ? (
        <p className="m-0 text-sm font-semibold text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="m-0 text-sm font-semibold text-[var(--color-success-text)]" role="status">
          {message}
        </p>
      ) : null}

      {active.length > 0 ? (
        <ul className="m-0 grid list-none gap-3 p-0">
          {active.map((variant) => {
            const value = rowValue(variant);
            const dirty =
              value.name !== variant.name ||
              nairaInputToKobo(value.price) !== variant.price;

            return (
              <li
                className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
                key={variant.id}
              >
                <Input
                  disabled={!canEdit}
                  label="Size or option"
                  onChange={(event) =>
                    setEdits((current) => ({
                      ...current,
                      [variant.id]: { ...value, name: event.target.value },
                    }))
                  }
                  value={value.name}
                />
                <Input
                  disabled={!canEdit}
                  inputMode="decimal"
                  label="Price (₦)"
                  onChange={(event) =>
                    setEdits((current) => ({
                      ...current,
                      [variant.id]: { ...value, price: event.target.value },
                    }))
                  }
                  value={value.price}
                />
                {canEdit ? (
                  <div className="flex gap-2">
                    <Button
                      disabled={!dirty || nairaInputToKobo(value.price) <= 0 || !value.name.trim()}
                      icon={<Save className="h-4 w-4" aria-hidden="true" />}
                      loading={busyId === variant.id}
                      onClick={() =>
                        run(
                          variant.id,
                          () =>
                            updateAdminProductVariant(variant.id, {
                              name: value.name.trim(),
                              price: nairaInputToKobo(value.price),
                            }),
                          `${value.name.trim()} updated.`,
                        ).then((saved) => {
                          if (saved) {
                            setEdits((current) => {
                              const next = { ...current };
                              delete next[variant.id];
                              return next;
                            });
                          }
                        })
                      }
                      variant="secondary"
                    >
                      Save
                    </Button>
                    <Button
                      aria-label={`Remove ${variant.name}`}
                      disabled={busyId !== null}
                      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() =>
                        run(
                          variant.id,
                          () => archiveAdminProductVariant(variant.id),
                          `${variant.name} removed.`,
                        )
                      }
                      variant="ghost"
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {canEdit ? (
        <div className="grid gap-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-strong)] p-3">
          <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
            <Input
              label="New size or option"
              onChange={(event) => setNewName(event.target.value)}
              placeholder="e.g. Medium"
              value={newName}
            />
            <Input
              inputMode="decimal"
              label="Price (₦)"
              onChange={(event) => setNewPrice(event.target.value)}
              placeholder="e.g. 11000"
              value={newPrice}
            />
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              loading={busyId === "new"}
              onClick={() => addVariant()}
              variant="secondary"
            >
              Add
            </Button>
          </div>
          {unusedPresets.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                Quick names:
              </span>
              {unusedPresets.map((preset) => (
                <button
                  className="min-h-9 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 text-xs font-semibold hover:bg-[var(--color-surface-muted)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  key={preset}
                  onClick={() => setNewName(preset)}
                  type="button"
                >
                  {preset}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

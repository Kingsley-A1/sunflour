"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import {
  getApiErrorMessage,
  updateAdminHomepageHeroProducts,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill";
import type {
  AdminHomepageHeroProduct,
  AdminProduct,
  UserRole,
} from "@/types/domain";

interface HomepageHeroProductsClientProps {
  heroProducts: AdminHomepageHeroProduct[];
  products: AdminProduct[];
  role: UserRole;
}

interface HeroSlot {
  productId: string;
  isActive: boolean;
}

const HERO_SLOT_COUNT = 4;

function buildInitialSlots(
  heroProducts: AdminHomepageHeroProduct[],
): HeroSlot[] {
  const sortedHeroProducts = [...heroProducts].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  );

  return Array.from({ length: HERO_SLOT_COUNT }, (_, index) => {
    const placement = sortedHeroProducts[index];

    return {
      productId: placement?.productId ?? "",
      isActive: placement?.isActive ?? true,
    };
  });
}

export function HomepageHeroProductsClient({
  heroProducts,
  products,
  role,
}: HomepageHeroProductsClientProps) {
  const [slots, setSlots] = useState<HeroSlot[]>(() =>
    buildInitialSlots(heroProducts),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const canManageHeroProducts =
    role === "SUPER_ADMIN" || role === "MEDIA_MANAGER";
  const selectableProducts = useMemo(
    () =>
      products
        .filter(
          (product) =>
            product.status === "ACTIVE" && product.category.isActive,
        )
        .sort((first, second) => first.name.localeCompare(second.name)),
    [products],
  );
  const selectedProductIds = slots
    .map((slot) => slot.productId)
    .filter(Boolean);
  const duplicateProductIds = selectedProductIds.filter(
    (productId, index) => selectedProductIds.indexOf(productId) !== index,
  );

  function updateSlot(index: number, nextSlot: Partial<HeroSlot>) {
    setSlots((currentSlots) =>
      currentSlots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...nextSlot } : slot,
      ),
    );
  }

  function moveSlot(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= slots.length) {
      return;
    }

    setSlots((currentSlots) => {
      const nextSlots = [...currentSlots];
      const movedSlot = nextSlots[index];
      const targetSlot = nextSlots[nextIndex];

      if (!movedSlot || !targetSlot) {
        return currentSlots;
      }

      nextSlots[index] = targetSlot;
      nextSlots[nextIndex] = movedSlot;

      return nextSlots;
    });
  }

  async function saveHeroProducts() {
    setError(null);
    setMessage(null);

    if (duplicateProductIds.length > 0) {
      setError("Choose each hero product only once.");
      return;
    }

    setIsSaving(true);

    try {
      const updatedHeroProducts = await updateAdminHomepageHeroProducts({
        items: slots
          .filter((slot) => slot.productId)
          .map((slot, index) => ({
            productId: slot.productId,
            sortOrder: index,
            isActive: slot.isActive,
          })),
      });

      setSlots(buildInitialSlots(updatedHeroProducts));
      setMessage("Homepage hero products saved.");
    } catch (heroError) {
      setError(
        getApiErrorMessage(
          heroError,
          "Hero products could not be saved. Check permissions and product status.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="homepage-hero-products-title"
      className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="m-0 flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
            <Star className="h-4 w-4" aria-hidden="true" />
            Homepage merchandising
          </p>
          <h2
            className="m-0 mt-1 text-xl font-extrabold"
            id="homepage-hero-products-title"
          >
            Hero product slots
          </h2>
          <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            Choose the four active products that appear first on the public
            homepage. Empty slots fall back to recent and popular catalog items.
          </p>
        </div>
        {canManageHeroProducts ? (
          <Button loading={isSaving} onClick={saveHeroProducts}>
            Save hero products
          </Button>
        ) : (
          <p className="m-0 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
            This merchandising setup is managed by super admins and media
            managers.
          </p>
        )}
      </div>

      {message ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success)]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      {selectableProducts.length === 0 ? (
        <EmptyState
          description="Create or activate catalog products before choosing homepage hero products."
          title="No active products available"
        />
      ) : (
        <div className="grid gap-3">
          {slots.map((slot, index) => {
            const product = products.find(
              (candidate) => candidate.id === slot.productId,
            );

            return (
              <div
                className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 lg:grid-cols-[minmax(0,1fr)_auto]"
                key={`hero-slot-${index}`}
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-end">
                  <Select
                    disabled={!canManageHeroProducts}
                    label={`Slot ${index + 1}`}
                    onChange={(event) =>
                      updateSlot(index, { productId: event.target.value })
                    }
                    value={slot.productId}
                  >
                    <option value="">Use fallback product</option>
                    {selectableProducts.map((selectableProduct) => (
                      <option
                        disabled={
                          selectedProductIds.includes(selectableProduct.id) &&
                          selectableProduct.id !== slot.productId
                        }
                        key={selectableProduct.id}
                        value={selectableProduct.id}
                      >
                        {selectableProduct.name}
                      </option>
                    ))}
                  </Select>
                  <Checkbox
                    checked={slot.isActive}
                    disabled={!canManageHeroProducts || !slot.productId}
                    label="Show slot"
                    onChange={(event) =>
                      updateSlot(index, { isActive: event.target.checked })
                    }
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {product ? <StatusPill status={product.status} /> : null}
                  <Button
                    disabled={!canManageHeroProducts || index === 0}
                    icon={<ArrowUp className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => moveSlot(index, -1)}
                    size="sm"
                    variant="secondary"
                  >
                    Up
                  </Button>
                  <Button
                    disabled={!canManageHeroProducts || index === slots.length - 1}
                    icon={
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    }
                    onClick={() => moveSlot(index, 1)}
                    size="sm"
                    variant="secondary"
                  >
                    Down
                  </Button>
                  <Button
                    disabled={!canManageHeroProducts || !slot.productId}
                    onClick={() =>
                      updateSlot(index, { productId: "", isActive: true })
                    }
                    size="sm"
                    variant="ghost"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

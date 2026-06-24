"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { SearchBar } from "@/components/commerce/search-bar";
import {
  getApiErrorMessage,
  updateAdminTabularMenu,
} from "@/lib/api/client";
import { koboToNairaInput, nairaInputToKobo } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminTabularMenuContent,
  TabularMenuCategory,
  TabularMenuItem,
  TabularMenuPrice,
} from "@/types/domain";

interface TabularMenuManagerClientProps {
  initialMenu: AdminTabularMenuContent;
}

export function TabularMenuManagerClient({
  initialMenu,
}: TabularMenuManagerClientProps) {
  const [draft, setDraft] = useState(initialMenu);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const sortedCategories = useMemo(
    () =>
      [...draft.categories].sort(
        (left, right) =>
          left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
      ),
    [draft.categories],
  );

  const visibleItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...draft.items]
      .sort(
        (left, right) =>
          left.sortOrder - right.sortOrder || left.name.localeCompare(right.name),
      )
      .filter((item) => {
        if (categoryFilter !== "all" && item.categoryId !== categoryFilter) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const categoryLabel =
          draft.categories.find((category) => category.id === item.categoryId)
            ?.label ?? "";

        return [
          item.name,
          item.description,
          item.details,
          categoryLabel,
          ...item.tags,
          ...item.ingredients,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      });
  }, [categoryFilter, draft.categories, draft.items, searchQuery]);

  const totalPriceRows = draft.items.reduce(
    (count, item) => count + item.prices.length,
    0,
  );

  function updateCategory(
    categoryId: string,
    updater: (category: TabularMenuCategory) => TabularMenuCategory,
  ) {
    setDraft((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? updater(category) : category,
      ),
    }));
  }

  function renameCategoryId(categoryId: string, nextValue: string) {
    const normalizedNextId = toIdentifier(nextValue || categoryId);
    const nextFilterId = uniqueIdentifier(
      normalizedNextId,
      draft.categories
        .filter((category) => category.id !== categoryId)
        .map((category) => category.id),
    );

    setDraft((current) => {
      const otherIds = current.categories
        .filter((category) => category.id !== categoryId)
        .map((category) => category.id);
      const nextId = uniqueIdentifier(normalizedNextId, otherIds);

      return {
        ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId ? { ...category, id: nextId } : category,
        ),
        items: current.items.map((item) =>
          item.categoryId === categoryId ? { ...item, categoryId: nextId } : item,
        ),
      };
    });

    if (categoryFilter === categoryId) {
      setCategoryFilter(nextFilterId);
    }
  }

  function updateItem(
    itemId: string,
    updater: (item: TabularMenuItem) => TabularMenuItem,
  ) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? updater(item) : item,
      ),
    }));
  }

  function updatePrice(
    itemId: string,
    priceId: string,
    updater: (price: TabularMenuPrice) => TabularMenuPrice,
  ) {
    updateItem(itemId, (item) => ({
      ...item,
      prices: item.prices.map((price) =>
        price.id === priceId ? updater(price) : price,
      ),
    }));
  }

  function addCategory() {
    setMessage(null);
    setError(null);

    setDraft((current) => {
      const nextIndex = current.categories.length + 1;
      const id = uniqueIdentifier(
        `category-${nextIndex}`,
        current.categories.map((category) => category.id),
      );

      return {
        ...current,
        categories: [
          ...current.categories,
          {
            id,
            label: `New category ${nextIndex}`,
            summary: "Update this category summary.",
            sortOrder: current.categories.length,
          },
        ],
      };
    });
  }

  function removeCategory(categoryId: string) {
    setMessage(null);

    if (draft.categories.length <= 1) {
      setError("Keep at least one category in the tabular menu.");
      return;
    }

    const relatedItems = draft.items.filter((item) => item.categoryId === categoryId);

    if (relatedItems.length > 0) {
      setError("Move or remove the related menu items before deleting this category.");
      return;
    }

    setError(null);
    setDraft((current) => ({
      ...current,
      categories: current.categories
        .filter((category) => category.id !== categoryId)
        .map((category, index) => ({
          ...category,
          sortOrder: index,
        })),
    }));
  }

  function addItem() {
    setMessage(null);
    setError(null);

    setDraft((current) => {
      const defaultCategoryId = current.categories[0]?.id ?? "uncategorized";
      const nextIndex = current.items.length + 1;
      const id = uniqueIdentifier(
        `new-item-${nextIndex}`,
        current.items.map((item) => item.id),
      );

      return {
        ...current,
        items: [
          ...current.items,
          {
            id,
            categoryId: defaultCategoryId,
            name: `New item ${nextIndex}`,
            description: "Add a short description.",
            details: "Add the fuller item details for this menu entry.",
            imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
            imageAlt: "Sunflour menu item",
            prices: [
              {
                id: `${id}-price-1`,
                label: null,
                amount: 0,
                sortOrder: 0,
              },
            ],
            tags: [],
            ingredients: [],
            sortOrder: current.items.length,
          },
        ],
      };
    });
  }

  function removeItem(itemId: string) {
    setMessage(null);

    if (draft.items.length <= 1) {
      setError("Keep at least one tabular menu item.");
      return;
    }

    setError(null);
    setDraft((current) => ({
      ...current,
      items: current.items
        .filter((item) => item.id !== itemId)
        .map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
    }));
  }

  function addPriceRow(itemId: string) {
    setMessage(null);
    setError(null);

    updateItem(itemId, (item) => {
      const nextIndex = item.prices.length + 1;
      const id = uniqueIdentifier(
        `${item.id}-price-${nextIndex}`,
        item.prices.map((price) => price.id),
      );

      return {
        ...item,
        prices: [
          ...item.prices,
          {
            id,
            label: `Option ${nextIndex}`,
            amount: 0,
            sortOrder: item.prices.length,
          },
        ],
      };
    });
  }

  function removePriceRow(itemId: string, priceId: string) {
    setMessage(null);
    setError(null);

    updateItem(itemId, (item) => {
      if (item.prices.length <= 1) {
        setError("Keep at least one price row for each menu item.");
        return item;
      }

      return {
        ...item,
        prices: item.prices
          .filter((price) => price.id !== priceId)
          .map((price, index) => ({
            ...price,
            sortOrder: index,
          })),
      };
    });
  }

  async function saveMenu() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const savedMenu = await updateAdminTabularMenu({
        categories: draft.categories.map((category, index) => ({
          ...category,
          id: toIdentifier(category.id || category.label || `category-${index + 1}`),
          sortOrder: index,
        })),
        items: draft.items.map((item, itemIndex) => ({
          ...item,
          id: toIdentifier(item.id || item.name || `item-${itemIndex + 1}`),
          categoryId: toIdentifier(item.categoryId),
          tags: normalizeStringList(item.tags),
          ingredients: normalizeStringList(item.ingredients),
          sortOrder: itemIndex,
          prices: item.prices.map((price, priceIndex) => ({
            ...price,
            id: toIdentifier(
              price.id || `${item.id || "item"}-price-${priceIndex + 1}`,
            ),
            label: price.label?.trim() || null,
            amount: price.amount,
            sortOrder: priceIndex,
          })),
        })),
      });

      setDraft(savedMenu);
      setConfirmOpen(false);
      setMessage(
        "Tabular menu saved. The public Menu tab now uses the latest approved reference content.",
      );
    } catch (menuError) {
      setError(
        getApiErrorMessage(
          menuError,
          "The tabular menu could not be saved. Check the edited values and try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      {error ? (
        <p
          className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success)]"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
        <div className="grid gap-2 sm:flex sm:items-end sm:justify-between">
          <div>
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Menu summary
            </p>
            <h2 className="m-0 mt-1 text-xl font-bold">Current content health</h2>
          </div>
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:underline"
            href="/menu?view=table"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open public tabular menu
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Categories" value={String(draft.categories.length)} />
          <SummaryCard label="Items" value={String(draft.items.length)} />
          <SummaryCard label="Price rows" value={String(totalPriceRows)} />
        </div>

        <div className="grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-text-muted)] lg:grid-cols-3">
          <p className="m-0">
            This content is a reference menu only. Trusted order pricing still
            comes from the live product catalog and backend quote flow.
          </p>
          <p className="m-0">
            Stable IDs keep category and item references predictable. Use
            lowercase letters, numbers, and hyphens only.
          </p>
          <p className="m-0">
            Remote image URLs should stay reliable. Use product-quality photos
            with clear alt text for accessibility.
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Categories
            </p>
            <h2 className="m-0 mt-1 text-xl font-bold">Edit labels and order</h2>
          </div>
          <Button icon={<Plus className="h-4 w-4" />} onClick={addCategory}>
            Add category
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {sortedCategories.map((category) => (
            <article
              className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4"
              key={category.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 text-lg font-bold">{category.label}</h3>
                  <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
                    ID: {category.id}
                  </p>
                </div>
                <Button
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => removeCategory(category.id)}
                  variant="ghost"
                >
                  Remove
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={`Category label for ${category.id}`}
                  onChange={(event) =>
                    updateCategory(category.id, (current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  value={category.label}
                />
                <Input
                  helpText="Lower numbers appear first."
                  inputMode="numeric"
                  label={`Sort order for ${category.id}`}
                  min={0}
                  onChange={(event) =>
                    updateCategory(category.id, (current) => ({
                      ...current,
                      sortOrder: Number(event.target.value) || 0,
                    }))
                  }
                  type="number"
                  value={String(category.sortOrder)}
                />
              </div>

                <Input
                  helpText="Used in public data references and admin editing."
                  label={`Category ID for ${category.label}`}
                  onChange={(event) => renameCategoryId(category.id, event.target.value)}
                  value={category.id}
                />

              <Textarea
                helpText="Short summary used in the tabular-menu browsing experience."
                label={`Summary for ${category.label}`}
                onChange={(event) =>
                  updateCategory(category.id, (current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
                value={category.summary}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem_11rem_auto] lg:items-end">
          <SearchBar
            label="Filter tabular menu items"
            onChange={setSearchQuery}
            placeholder="Burger, cake, pizza..."
            value={searchQuery}
          />
          <Select
            label="Category filter"
            onChange={(event) => setCategoryFilter(event.target.value)}
            value={categoryFilter}
          >
            <option value="all">All categories</option>
            {sortedCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-3 text-sm text-[var(--color-text-muted)]">
            {visibleItems.length} visible item
            {visibleItems.length === 1 ? "" : "s"}
          </div>
          <Button icon={<Plus className="h-4 w-4" />} onClick={addItem}>
            Add item
          </Button>
        </div>

        <div className="grid gap-4">
          {visibleItems.map((item) => (
            <article
              className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4"
              key={item.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="m-0 text-lg font-bold">{item.name}</h3>
                  <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
                    {draft.categories.find((category) => category.id === item.categoryId)
                      ?.label ?? "Unassigned category"}
                  </p>
                </div>
                <Button
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => removeItem(item.id)}
                  variant="ghost"
                >
                  Remove
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Input
                  label={`Item name for ${item.id}`}
                  onChange={(event) =>
                    updateItem(item.id, (current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  value={item.name}
                />
                <Input
                  helpText="Stable reference ID."
                  label={`Item ID for ${item.name}`}
                  onChange={(event) =>
                    updateItem(item.id, (current) => ({
                      ...current,
                      id: toIdentifier(event.target.value),
                    }))
                  }
                  value={item.id}
                />
                <Select
                  label={`Category for ${item.name}`}
                  onChange={(event) =>
                    updateItem(item.id, (current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                  value={item.categoryId}
                >
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </Select>
                <Input
                  helpText="Lower numbers appear first."
                  inputMode="numeric"
                  label={`Sort order for ${item.name}`}
                  min={0}
                  onChange={(event) =>
                    updateItem(item.id, (current) => ({
                      ...current,
                      sortOrder: Number(event.target.value) || 0,
                    }))
                  }
                  type="number"
                  value={String(item.sortOrder)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={`Image URL for ${item.name}`}
                  onChange={(event) =>
                    updateItem(item.id, (current) => ({
                      ...current,
                      imageUrl: event.target.value,
                    }))
                  }
                  value={item.imageUrl}
                />
                <Input
                  label={`Image alt text for ${item.name}`}
                  onChange={(event) =>
                    updateItem(item.id, (current) => ({
                      ...current,
                      imageAlt: event.target.value,
                    }))
                  }
                  value={item.imageAlt}
                />
              </div>

              <Textarea
                helpText="Short description shown in cards and table rows."
                label={`Short description for ${item.name}`}
                onChange={(event) =>
                  updateItem(item.id, (current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                value={item.description}
              />

              <Textarea
                helpText="Longer details shown in the item side panel."
                label={`Details for ${item.name}`}
                onChange={(event) =>
                  updateItem(item.id, (current) => ({
                    ...current,
                    details: event.target.value,
                  }))
                }
                value={item.details}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  helpText="Comma-separated list."
                  label={`Tags for ${item.name}`}
                  onChange={(event) =>
                    updateItem(item.id, (current) => ({
                      ...current,
                      tags: splitCommaSeparatedList(event.target.value),
                    }))
                  }
                  value={item.tags.join(", ")}
                />
                <Input
                  helpText="Comma-separated list."
                  label={`Ingredients for ${item.name}`}
                  onChange={(event) =>
                    updateItem(item.id, (current) => ({
                      ...current,
                      ingredients: splitCommaSeparatedList(event.target.value),
                    }))
                  }
                  value={item.ingredients.join(", ")}
                />
              </div>

              <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
                      Price rows
                    </p>
                    <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
                      Reference pricing only. Checkout totals still come from
                      the live product catalog.
                    </p>
                  </div>
                  <Button
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => addPriceRow(item.id)}
                    variant="secondary"
                  >
                    Add price row
                  </Button>
                </div>

                <div className="grid gap-3">
                  {item.prices.map((price) => (
                    <div
                      className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 lg:grid-cols-[minmax(0,1fr)_10rem_9rem_auto]"
                      key={price.id}
                    >
                      <Input
                        label={`Price label for ${item.name}`}
                        onChange={(event) =>
                          updatePrice(item.id, price.id, (current) => ({
                            ...current,
                            label: event.target.value || null,
                          }))
                        }
                        placeholder="Small, Medium, Family"
                        value={price.label ?? ""}
                      />
                      <Input
                        helpText="Enter naira, not kobo."
                        inputMode="decimal"
                        label={`Price amount for ${item.name}`}
                        min={0}
                        onChange={(event) =>
                          updatePrice(item.id, price.id, (current) => ({
                            ...current,
                            amount: nairaInputToKobo(event.target.value),
                          }))
                        }
                        type="number"
                        value={koboToNairaInput(price.amount)}
                      />
                      <Input
                        helpText="Lower numbers appear first."
                        inputMode="numeric"
                        label={`Price sort order for ${item.name}`}
                        min={0}
                        onChange={(event) =>
                          updatePrice(item.id, price.id, (current) => ({
                            ...current,
                            sortOrder: Number(event.target.value) || 0,
                          }))
                        }
                        type="number"
                        value={String(price.sortOrder)}
                      />
                      <div className="flex items-end">
                        <Button
                          className="w-full"
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => removePriceRow(item.id, price.id)}
                          variant="ghost"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {visibleItems.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-6 text-sm text-[var(--color-text-muted)]">
            No items match the current filter. Clear the search or add a new
            tabular-menu item.
          </div>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          Save after reviewing IDs, categories, and price rows. The public
          second Menu tab will update after revalidation.
        </p>
        <Button onClick={() => setConfirmOpen(true)}>Review and save</Button>
      </div>

      <ConfirmDialog
        confirmLabel="Save tabular menu"
        description="This updates the public reference menu only. It does not change live checkout prices, product snapshots, or order totals."
        loading={isSaving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={saveMenu}
        open={confirmOpen}
        title="Confirm tabular menu update"
      >
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          {draft.categories.length} categories, {draft.items.length} items,{" "}
          {totalPriceRows} price rows
        </p>
      </ConfirmDialog>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <p className="m-0 text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="m-0 mt-2 text-2xl font-extrabold">{value}</p>
    </article>
  );
}

function splitCommaSeparatedList(input: string) {
  return normalizeStringList(input.split(","));
}

function normalizeStringList(values: readonly string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function toIdentifier(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function uniqueIdentifier(seed: string, existingValues: readonly string[]) {
  const base = toIdentifier(seed);
  const existing = new Set(existingValues);

  if (!existing.has(base)) {
    return base;
  }

  let suffix = 2;

  while (existing.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminCategory,
  getApiErrorMessage,
  updateAdminCategory,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import type { AdminCategory } from "@/types/domain";

interface CategoryManagerClientProps {
  categories: AdminCategory[];
}

export function CategoryManagerClient({
  categories,
}: CategoryManagerClientProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeCategories = categories.filter((category) => category.isActive).length;
  const hiddenCategories = categories.length - activeCategories;

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (name.trim().length < 1) {
      setError("Enter category name.");
      return;
    }

    setIsSaving(true);

    try {
      await createAdminCategory({
        name,
        description: description || null,
        isActive: true,
        sortOrder: Number(sortOrder) || 0,
      });
      setMessage("Category created and ready for product assignment.");
      setName("");
      setDescription("");
      setSortOrder("0");
      router.refresh();
    } catch (categoryError) {
      setError(
        getApiErrorMessage(
          categoryError,
          "Category could not be created. Check permission and validation.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:items-start">
        <form
          className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]"
          onSubmit={createCategory}
        >
          <div className="grid gap-1">
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Create category
            </p>
            <h2 className="m-0 text-xl font-bold">Add a new catalog group</h2>
            <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
              Create the category first, then assign products to it from the
              product editor.
            </p>
          </div>
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
          <Input
            label="Category name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <Input
            helpText="Optional public-facing description for menus and admin context."
            label="Description"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
          <Input
            helpText="Lower numbers appear first."
            inputMode="numeric"
            label="Sort order"
            min={0}
            onChange={(event) => setSortOrder(event.target.value)}
            type="number"
            value={sortOrder}
          />
          <Button loading={isSaving} type="submit">
            Create category
          </Button>
        </form>

        <section className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
          <div className="grid gap-1">
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Category health
            </p>
            <h2 className="m-0 text-xl font-bold">Keep browsing predictable</h2>
            <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
              Use a small, stable category set. Hide categories only when they
              should disappear from public browsing.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Total categories" value={String(categories.length)} />
            <SummaryCard label="Visible now" value={String(activeCategories)} />
            <SummaryCard label="Hidden" value={String(hiddenCategories)} />
          </div>
          <div className="grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-text-muted)] sm:grid-cols-3">
            <p className="m-0">
              Slugs are generated server-side and stay stable for menu routing.
            </p>
            <p className="m-0">
              Sort order controls how customers encounter categories across the
              storefront.
            </p>
            <p className="m-0">
              Status changes affect future public browsing only. Existing orders
              keep their snapshots.
            </p>
          </div>
        </section>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
              Existing categories
            </p>
            <h2 className="m-0 mt-1 text-xl font-bold">Review and update</h2>
          </div>
          <p className="m-0 text-sm text-[var(--color-text-muted)]">
            {categories.length} categories configured
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
            No categories exist yet. Create the first category to organize the
            catalog.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {categories.map((category) => (
              <CategoryCard category={category} key={category.id} />
            ))}
          </div>
        )}
      </section>
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

function CategoryCard({ category }: { category: AdminCategory }) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder));
  const [isActive, setIsActive] = useState(category.isActive);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (name.trim().length < 1) {
      setError("Enter category name.");
      return;
    }

    setIsSaving(true);

    try {
      await updateAdminCategory(category.id, {
        name,
        description: description || null,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });
      setMessage("Category updated.");
      router.refresh();
    } catch (categoryError) {
      setError(
        getApiErrorMessage(
          categoryError,
          "Category could not be updated. Check permission and validation.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
      <form className="grid gap-4" onSubmit={saveCategory}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="m-0 text-lg font-bold">{category.name}</h3>
              <StatusPill status={isActive ? "ACTIVE" : "HIDDEN"} />
            </div>
            <p className="m-0 mt-2 break-all text-sm text-[var(--color-text-muted)]">
              Slug: {category.slug}
            </p>
          </div>
          <p className="m-0 rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
            ID: {category.id}
          </p>
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={`Category name for ${category.name}`}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <Input
            helpText="Lower numbers appear first."
            inputMode="numeric"
            label={`Sort order for ${category.name}`}
            min={0}
            onChange={(event) => setSortOrder(event.target.value)}
            type="number"
            value={sortOrder}
          />
        </div>

        <Input
          label={`Description for ${category.name}`}
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />

        <div className="grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <Checkbox
            checked={isActive}
            label={`Show ${category.name} in public browsing`}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <Button className="w-full sm:w-auto" loading={isSaving} type="submit">
            Save category
          </Button>
        </div>
      </form>
    </article>
  );
}

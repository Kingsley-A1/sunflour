"use client";

import { useState } from "react";
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function createCategory() {
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
      setMessage("Category created. Refresh to see the latest list.");
      setName("");
      setDescription("");
      setSortOrder("0");
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
    <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
      <section className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="m-0 text-lg font-bold">Create category</h2>
        {error ? <p className="m-0 text-sm font-semibold text-[var(--color-danger)]">{error}</p> : null}
        {message ? <p className="m-0 text-sm font-semibold text-[var(--color-success)]">{message}</p> : null}
        <Input label="Name" onChange={(event) => setName(event.target.value)} value={name} />
        <Input
          label="Description"
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
        <Input
          inputMode="numeric"
          label="Sort order"
          min={0}
          onChange={(event) => setSortOrder(event.target.value)}
          type="number"
          value={sortOrder}
        />
        <Button loading={isSaving} onClick={createCategory}>
          Create category
        </Button>
      </section>
      <section className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-[36rem] text-left text-sm">
          <thead className="bg-[var(--color-surface-soft)]">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Sort order</th>
              <th className="p-3">State</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <CategoryRow category={category} key={category.id} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function CategoryRow({ category }: { category: AdminCategory }) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder));
  const [isActive, setIsActive] = useState(category.isActive);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveCategory() {
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
      setMessage("Saved. Refresh to confirm generated slug changes.");
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
    <tr className="border-t border-[var(--color-border)]">
      <td className="min-w-56 p-3 align-top">
        <Input
          label={`Name for ${category.name}`}
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
        <div className="mt-2">
          <Input
            label={`Description for ${category.name}`}
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </div>
        {error ? (
          <p className="m-0 mt-2 text-sm font-semibold text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="m-0 mt-2 text-sm font-semibold text-[var(--color-success)]">
            {message}
          </p>
        ) : null}
      </td>
      <td className="p-3 align-top text-[var(--color-text-muted)]">
        {category.slug}
      </td>
      <td className="min-w-36 p-3 align-top">
        <Input
          inputMode="numeric"
          label={`Sort order for ${category.name}`}
          min={0}
          onChange={(event) => setSortOrder(event.target.value)}
          type="number"
          value={sortOrder}
        />
      </td>
      <td className="p-3 align-top">
        <StatusPill status={isActive ? "ACTIVE" : "HIDDEN"} />
        <div className="mt-2">
          <Checkbox
            checked={isActive}
            label={`Show ${category.name} publicly`}
            onChange={(event) => setIsActive(event.target.checked)}
          />
        </div>
      </td>
      <td className="p-3 align-top">
        <Button loading={isSaving} onClick={saveCategory} size="sm">
          Save
        </Button>
      </td>
    </tr>
  );
}

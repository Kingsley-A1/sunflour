"use client";

import { useState } from "react";
import { createAdminCategory, getApiErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
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
      });
      setMessage("Category created. Refresh to see the latest list.");
      setName("");
      setDescription("");
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
              <th className="p-3">State</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr className="border-t border-[var(--color-border)]" key={category.id}>
                <td className="p-3 font-semibold">{category.name}</td>
                <td className="p-3 text-[var(--color-text-muted)]">{category.slug}</td>
                <td className="p-3">
                  <StatusPill status={category.isActive ? "ACTIVE" : "HIDDEN"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

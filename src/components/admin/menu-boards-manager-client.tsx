"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Save, Trash2 } from "lucide-react";
import { getApiErrorMessage, updateAdminMenuBoards } from "@/lib/api/client";
import { uploadSingleAdminImage } from "@/lib/api/product-image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MenuBoard } from "@/types/domain";

const MAX_BOARDS = 12;

interface MenuBoardsManagerClientProps {
  initialBoards: MenuBoard[];
}

export function MenuBoardsManagerClient({
  initialBoards,
}: MenuBoardsManagerClientProps) {
  const [boards, setBoards] = useState(initialBoards);
  const [savedJson, setSavedJson] = useState(JSON.stringify(initialBoards));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = JSON.stringify(boards) !== savedJson;

  function updateBoard(id: string, patch: Partial<MenuBoard>) {
    setBoards((current) =>
      current.map((board) => (board.id === id ? { ...board, ...patch } : board)),
    );
  }

  function moveBoard(index: number, direction: -1 | 1) {
    setBoards((current) => {
      const target = index + direction;

      if (target < 0 || target >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  async function addBoards(files: FileList | null) {
    const selected = Array.from(files ?? []);

    if (selected.length === 0) {
      return;
    }

    setError(null);
    setMessage(null);

    if (boards.length + selected.length > MAX_BOARDS) {
      setError(`You can have up to ${MAX_BOARDS} menu boards.`);
      return;
    }

    setIsUploading(true);

    try {
      const added: MenuBoard[] = [];

      for (const file of selected) {
        const [dimensions, uploaded] = await Promise.all([
          readImageSize(file),
          uploadSingleAdminImage(file, "MENU_BOARD"),
        ]);
        const title = titleFromFileName(file.name);

        added.push({
          id: uniqueBoardId(title, [...boards, ...added].map((board) => board.id)),
          title,
          imageUrl: uploaded.url,
          altText: `Sunflour Bakery ${title} menu`,
          width: dimensions.width,
          height: dimensions.height,
          visible: true,
        });
      }

      setBoards((current) => [...current, ...added]);
      setMessage(
        `${added.length} menu ${added.length === 1 ? "image" : "images"} uploaded. Review the titles, then save.`,
      );
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "The menu image could not be uploaded."));
    } finally {
      setIsUploading(false);
    }
  }

  async function replaceImage(board: MenuBoard, file: File | undefined) {
    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsUploading(true);

    try {
      const [dimensions, uploaded] = await Promise.all([
        readImageSize(file),
        uploadSingleAdminImage(file, "MENU_BOARD"),
      ]);

      updateBoard(board.id, {
        imageUrl: uploaded.url,
        width: dimensions.width,
        height: dimensions.height,
      });
      setMessage(`${board.title} image replaced. Save to publish it.`);
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "The menu image could not be uploaded."));
    } finally {
      setIsUploading(false);
    }
  }

  async function save() {
    setError(null);
    setMessage(null);

    if (boards.length > 0 && !boards.some((board) => board.visible)) {
      setError("Keep at least one menu board visible.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateAdminMenuBoards(
        boards.map((board) => ({
          ...board,
          title: board.title.trim(),
          altText: board.altText.trim() || `Sunflour Bakery ${board.title.trim()} menu`,
        })),
      );

      setBoards(result.boards);
      setSavedJson(JSON.stringify(result.boards));
      setMessage("Menu boards saved. The public Menu page now shows them.");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "The menu boards could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  const mainId = boards.find((board) => board.visible)?.id;

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="m-0 text-xl font-bold">Menu images</h2>
            <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              The first visible board is the main menu and takes the full width
              on mobile. The others appear underneath it. Use the arrows to
              reorder.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label
              className={`inline-flex min-h-[var(--control-height-md)] cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 text-sm font-semibold hover:bg-[var(--color-surface-muted)] focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)] ${isUploading ? "pointer-events-none opacity-55" : ""}`}
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {isUploading ? "Uploading…" : "Add menu images"}
              <input
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                disabled={isUploading}
                multiple
                onChange={(event) => {
                  void addBoards(event.target.files);
                  event.target.value = "";
                }}
                type="file"
              />
            </label>
            <Button
              disabled={!isDirty || isUploading}
              icon={<Save className="h-4 w-4" aria-hidden="true" />}
              loading={isSaving}
              onClick={save}
            >
              Save menu boards
            </Button>
          </div>
        </div>

        {boards.length === 0 ? (
          <p className="m-0 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-6 text-sm text-[var(--color-text-muted)]">
            No menu images yet. Add one to show it on the public Menu page.
          </p>
        ) : null}

        <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
          {boards.map((board, index) => (
            <li
              className="grid content-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3"
              key={board.id}
            >
              <div className="relative overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]">
                <Image
                  alt={board.altText}
                  className="max-h-72 w-full object-contain"
                  height={board.height}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  src={board.imageUrl}
                  width={board.width}
                />
                {board.id === mainId ? (
                  <span className="absolute top-2 left-2 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold text-[var(--color-on-primary)]">
                    Main menu
                  </span>
                ) : null}
              </div>

              <Input
                label={`Title for board ${index + 1}`}
                onChange={(event) => updateBoard(board.id, { title: event.target.value })}
                value={board.title}
              />
              <Input
                helpText="Read aloud by screen readers. Briefly describe what the menu covers."
                label={`Image description for ${board.title}`}
                onChange={(event) => updateBoard(board.id, { altText: event.target.value })}
                value={board.altText}
              />

              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  checked={board.visible}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                  onChange={(event) => updateBoard(board.id, { visible: event.target.checked })}
                  type="checkbox"
                />
                Show on the public Menu page
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  aria-label={`Move ${board.title} up`}
                  disabled={index === 0}
                  icon={<ArrowUp className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => moveBoard(index, -1)}
                  variant="secondary"
                >
                  {""}
                </Button>
                <Button
                  aria-label={`Move ${board.title} down`}
                  disabled={index === boards.length - 1}
                  icon={<ArrowDown className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => moveBoard(index, 1)}
                  variant="secondary"
                >
                  {""}
                </Button>
                <label className="inline-flex min-h-[var(--control-height-md)] cursor-pointer items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-semibold hover:bg-[var(--color-surface-muted)] focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)]">
                  Replace image
                  <input
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                    disabled={isUploading}
                    onChange={(event) => {
                      void replaceImage(board, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                <Button
                  className="ml-auto"
                  icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                  onClick={() =>
                    setBoards((current) => current.filter((candidate) => candidate.id !== board.id))
                  }
                  variant="danger-outline"
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ol>

        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          Changes are not live until you press Save menu boards. JPEG, PNG,
          WebP or AVIF; large images are resized automatically.
        </p>
      </section>
    </div>
  );
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    image.src = url;
  });
}

function titleFromFileName(fileName: string): string {
  const base = fileName
    .replace(/\.[^./\\]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();

  return (base || "Menu").replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 80);
}

function uniqueBoardId(title: string, existing: readonly string[]): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "menu";
  let candidate = base;
  let suffix = 2;

  while (existing.includes(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

import { z } from "zod";

const identifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Boards are either uploaded to media storage (https URL) or shipped with the
// site under /public (relative path).
const boardImageUrlSchema = z
  .string()
  .trim()
  .min(1, "Upload a menu image.")
  .max(600)
  .refine(
    (value) => value.startsWith("/") || /^https:\/\//i.test(value),
    "Use an uploaded image or an https image URL.",
  );

export const menuBoardSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1, "Enter the board ID.")
      .max(80)
      .regex(identifierPattern, "Use lowercase letters, numbers, and hyphens only."),
    title: z.string().trim().min(1, "Enter a menu title.").max(80),
    imageUrl: boardImageUrlSchema,
    altText: z.string().trim().min(1, "Describe the menu image.").max(180),
    width: z.number().int().min(100).max(10_000),
    height: z.number().int().min(100).max(10_000),
    visible: z.boolean(),
  })
  .strict();

function hasUniqueIds(boards: readonly { id: string }[]) {
  return new Set(boards.map((board) => board.id)).size === boards.length;
}

// Order in the array is the display order: the first visible board is the
// main menu (full width on mobile), the rest are listed beneath it.
export const menuBoardsValueSchema = z
  .object({
    boards: z
      .array(menuBoardSchema)
      .max(12, "Keep it to 12 menu boards or fewer.")
      .refine(hasUniqueIds, "Each menu board needs a unique ID."),
  })
  .strict();

export const menuBoardsUpdateSchema = menuBoardsValueSchema;

export type MenuBoardValue = z.infer<typeof menuBoardSchema>;
export type MenuBoardsValue = z.infer<typeof menuBoardsValueSchema>;
export type MenuBoardsUpdateInput = z.infer<typeof menuBoardsUpdateSchema>;

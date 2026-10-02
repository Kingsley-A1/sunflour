import { describe, expect, it } from "vitest";
import { defaultMenuBoards } from "@/server/modules/menu/menu-boards-defaults";
import { menuBoardsUpdateSchema } from "@/server/modules/menu/menu-boards-schemas";

const board = {
  id: "pizza",
  title: "Pizza",
  imageUrl: "https://cdn.example.com/menu-boards/pizza.webp",
  altText: "Pizza menu",
  width: 960,
  height: 1280,
  visible: true,
};

describe("menu boards schema", () => {
  it("accepts the shipped default boards", () => {
    expect(menuBoardsUpdateSchema.safeParse(defaultMenuBoards).success).toBe(true);
  });

  it("accepts uploaded https images and site-relative images", () => {
    const result = menuBoardsUpdateSchema.safeParse({
      boards: [board, { ...board, id: "local", imageUrl: "/menu-boards/pizza.jpg" }],
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate IDs, unsafe URLs, bad IDs and more than 12 boards", () => {
    expect(menuBoardsUpdateSchema.safeParse({ boards: [board, board] }).success).toBe(false);
    expect(
      menuBoardsUpdateSchema.safeParse({
        boards: [{ ...board, imageUrl: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
    expect(
      menuBoardsUpdateSchema.safeParse({ boards: [{ ...board, id: "Not Valid" }] }).success,
    ).toBe(false);
    expect(
      menuBoardsUpdateSchema.safeParse({
        boards: Array.from({ length: 13 }, (_, index) => ({ ...board, id: `board-${index}` })),
      }).success,
    ).toBe(false);
  });
});

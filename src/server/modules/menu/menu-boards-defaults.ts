import type { MenuBoardsValue } from "./menu-boards-schemas";

// Used until an admin saves their own boards.
export const defaultMenuBoards: MenuBoardsValue = {
  boards: [
    {
      id: "main-menu",
      title: "Main menu",
      imageUrl: "/menu-boards/main-menu.jpg",
      altText:
        "Sunflour Bakery main menu — cakes, burgers, sandwiches, ice cream, pizza, pastries and chops with prices",
      width: 1024,
      height: 1280,
      visible: true,
    },
    {
      id: "bakery-desserts",
      title: "Bakery & desserts",
      imageUrl: "/menu-boards/bakery-desserts.jpg",
      altText:
        "Sunflour Bakery bakery and desserts menu — cakes, ice cream, pastries and toppings with prices",
      width: 1024,
      height: 1280,
      visible: true,
    },
    {
      id: "savouries",
      title: "Savouries",
      imageUrl: "/menu-boards/savouries.jpg",
      altText:
        "Sunflour Bakery savouries menu — burgers, sandwiches, protein and chops with prices",
      width: 960,
      height: 1280,
      visible: true,
    },
    {
      id: "pizza",
      title: "Pizza",
      imageUrl: "/menu-boards/pizza.jpg",
      altText:
        "Sunflour Bakery pizza menu — regular and special pizzas with sizes and prices",
      width: 960,
      height: 1280,
      visible: true,
    },
  ],
};

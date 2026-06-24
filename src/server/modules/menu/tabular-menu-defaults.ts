import type { TabularMenuContentValue } from "./tabular-menu-schemas";

type MenuPriceSeed = {
  label?: string;
  amount: string;
};

type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string;
  details: string;
  image: string;
  imageAlt: string;
  prices: MenuPriceSeed[];
  tags: string[];
  ingredients?: string[];
};

const images = {
  cake:
    "https://cdn.pixabay.com/photo/2016/11/22/18/52/cake-1850011_1280.jpg",
  cakeLayer:
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
  cakeCelebration:
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
  cakeRoll:
    "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=1200&q=80",
  burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  burgerClassic:
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
  burgerStack:
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=80",
  burgerPlate:
    "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1200&q=80",
  burgerDouble:
    "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1200&q=80",
  sandwich:
    "https://cdn.pixabay.com/photo/2022/03/11/10/06/wrap-7061741_1280.jpg",
  shawarma:
    "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80",
  sandwichGrilled:
    "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=1200&q=80",
  sandwichToast:
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80",
  friedChicken:
    "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=1200&q=80",
  friedChickenPlate:
    "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=1200&q=80",
  chickenPlate:
    "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1200&q=80",
  iceCream:
    "https://images.unsplash.com/photo-1587563974670-b5181b459b30?auto=format&fit=crop&w=1200&q=80",
  iceCreamCone:
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80",
  iceCreamScoops:
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=80",
  iceCreamCup:
    "https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=1200&q=80",
  pizza:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
  pizzaSlice:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
  pizzaTable:
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80",
  pizzaOven:
    "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1200&q=80",
  pastry:
    "https://upload.wikimedia.org/wikipedia/commons/7/73/Sweeney_%26_Todd_meat_pie.jpg",
  doughnut:
    "https://cdn.pixabay.com/photo/2021/02/05/14/24/food-5984722_1280.jpg",
  doughnutBox:
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80",
  cookies:
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80",
  croissant:
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
  chops:
    "https://upload.wikimedia.org/wikipedia/commons/1/16/Meat_pie_samosa_and_spring_roll.jpg",
} as const;

const categories = [
  {
    id: "cakes",
    label: "Cakes",
    summary: "Soft bakery cuts and celebration sizes.",
  },
  {
    id: "burgers",
    label: "Burgers",
    summary: "Chicken, beef, double protein, and Lebanese-style options.",
  },
  {
    id: "sandwiches",
    label: "Sandwiches",
    summary: "Shawarma, fajita, fries sandwich, and chicken tabouk.",
  },
  {
    id: "protein",
    label: "Protein",
    summary: "Peppered fried chicken for a filling side or main bite.",
  },
  {
    id: "ice-cream",
    label: "Ice Cream",
    summary: "Scoops, cones, cups, flavours, and toppings.",
  },
  {
    id: "pastries",
    label: "Pastries",
    summary: "Pies, biscuits, cookies, doughnuts, and mini pizza.",
  },
  {
    id: "chops",
    label: "Chops",
    summary: "Party-style small chops and quick snacks.",
  },
  {
    id: "pizza",
    label: "Pizza",
    summary: "Regular and special pizzas with four serving sizes.",
  },
] as const;

function regularPizzaPrices() {
  return [
    { label: "Small", amount: "NGN 5,500" },
    { label: "Medium", amount: "NGN 8,000" },
    { label: "Big", amount: "NGN 12,000" },
    { label: "Family", amount: "NGN 13,500" },
  ] as const;
}

function specialPizzaPrices() {
  return [
    { label: "Small", amount: "NGN 7,500" },
    { label: "Medium", amount: "NGN 10,000" },
    { label: "Big", amount: "NGN 14,000" },
    { label: "Family", amount: "NGN 15,500" },
  ] as const;
}

const baseMenuItems = [
  {
    id: "swiss-roll",
    category: "cakes",
    name: "Swiss Roll",
    description: "Soft rolled sponge with a sweet cream-style finish.",
    details:
      "A light bakery roll for customers who want something sweet without ordering a full celebration cake.",
    image: images.cake,
    imageAlt: "Chocolate cake slice with soft bakery layers",
    prices: [{ amount: "NGN 2,000" }],
    tags: ["Cake", "Single order"],
    ingredients: ["Sponge cake", "Cream filling", "Bakery glaze"],
  },
  {
    id: "sponge-cake",
    category: "cakes",
    name: "Sponge Cake",
    description: "Classic soft cake with a simple, fluffy crumb.",
    details:
      "A clean bakery favourite for tea breaks, office bites, or a light dessert after a meal.",
    image: images.cake,
    imageAlt: "Fresh cake slice with chocolate layers",
    prices: [{ amount: "NGN 2,000" }],
    tags: ["Cake", "Bakery"],
    ingredients: ["Sponge cake", "Bakery frosting"],
  },
  {
    id: "coco-bean-cake",
    category: "cakes",
    name: "Coco Bean Cake",
    description: "Chocolate-forward cake with a richer bakery profile.",
    details:
      "Built for chocolate lovers who want a stronger cocoa note in a compact cake order.",
    image: images.cake,
    imageAlt: "Chocolate cake presented on a plate",
    prices: [{ amount: "NGN 2,200" }],
    tags: ["Cake", "Chocolate"],
    ingredients: ["Cocoa cake", "Chocolate finish"],
  },
  {
    id: "six-inch-cake",
    category: "cakes",
    name: "6 Inches Cake",
    description: "Compact celebration cake for small birthdays and surprises.",
    details:
      "A practical celebration size for intimate gatherings, office surprises, and small family moments.",
    image: images.cake,
    imageAlt: "Celebration cake with layered chocolate texture",
    prices: [{ amount: "NGN 8,000" }],
    tags: ["Cake", "Celebration"],
    ingredients: ["Bakery sponge", "Frosting", "Decorative finish"],
  },
  {
    id: "seven-inch-cake",
    category: "cakes",
    name: "7 Inches Cake",
    description: "Larger celebration cake with more serving room.",
    details:
      "A better fit when the table needs more slices while keeping the order simple and affordable.",
    image: images.cake,
    imageAlt: "Layered chocolate celebration cake",
    prices: [{ amount: "NGN 10,000" }],
    tags: ["Cake", "Celebration"],
    ingredients: ["Bakery sponge", "Frosting", "Decorative finish"],
  },
  {
    id: "chicken-burger-regular",
    category: "burgers",
    name: "Chicken Burger Regular",
    description: "Chicken burger with a soft bun, greens, and house sauce.",
    details:
      "A straight-to-the-point chicken burger for lunch, school runs, or a quick evening meal.",
    image: images.burger,
    imageAlt: "Chicken burger with lettuce and sauce",
    prices: [{ amount: "NGN 2,000" }],
    tags: ["Burger", "Chicken"],
    ingredients: ["Chicken patty", "Burger bun", "Lettuce", "House sauce"],
  },
  {
    id: "chicken-burger-special",
    category: "burgers",
    name: "Chicken Burger Special",
    description: "A fuller chicken burger with extra flavour and toppings.",
    details:
      "The upgraded chicken burger when the customer wants more texture, sauce, and bite.",
    image: images.burger,
    imageAlt: "Stacked burger with fresh vegetables",
    prices: [{ amount: "NGN 3,000" }],
    tags: ["Burger", "Special"],
    ingredients: ["Chicken patty", "Burger bun", "Vegetables", "House sauce"],
  },
  {
    id: "beef-burger-regular",
    category: "burgers",
    name: "Beef Burger Regular",
    description: "Beef patty burger with fresh vegetables and sauce.",
    details:
      "A classic beef burger for customers who want a simple, filling, familiar order.",
    image: images.burger,
    imageAlt: "Beef burger with lettuce and tomato",
    prices: [{ amount: "NGN 2,000" }],
    tags: ["Burger", "Beef"],
    ingredients: ["Beef patty", "Burger bun", "Lettuce", "Tomato", "Sauce"],
  },
  {
    id: "beef-burger-special",
    category: "burgers",
    name: "Beef Burger Special",
    description: "Richer beef burger with a fuller special-style build.",
    details:
      "A heavier beef burger option for customers who want more than the regular serving.",
    image: images.burger,
    imageAlt: "Large beef burger with melted cheese and vegetables",
    prices: [{ amount: "NGN 3,000" }],
    tags: ["Burger", "Special"],
    ingredients: ["Beef patty", "Burger bun", "Vegetables", "House sauce"],
  },
  {
    id: "lebanese-beef-burger-fries",
    category: "burgers",
    name: "Lebanese Beef Burger + Fries",
    description: "Beef patty, grilled onion, tomato, coleslaw, and fries.",
    details:
      "A more complete burger plate with a Lebanese-style build and fries included.",
    image: images.burger,
    imageAlt: "Burger served with fries",
    prices: [{ amount: "NGN 4,500" }],
    tags: ["Burger", "Fries included"],
    ingredients: ["Beef patty", "Grilled onion", "Tomato", "Coleslaw", "Fries"],
  },
  {
    id: "lebanese-chicken-burger",
    category: "burgers",
    name: "Lebanese Beef Chicken Burger",
    description: "Tomato, mayo, lettuce, pickles, and a rich burger build.",
    details:
      "A layered burger option with fresh crunch, creamy sauce, and pickled sharpness.",
    image: images.burger,
    imageAlt: "Chicken burger with lettuce and pickles",
    prices: [{ amount: "NGN 4,500" }],
    tags: ["Burger", "Lebanese style"],
    ingredients: ["Chicken", "Tomato", "Mayonnaise", "Lettuce", "Pickles"],
  },
  {
    id: "double-protein-burger",
    category: "burgers",
    name: "Double Protein Burger",
    description: "A protein-heavy burger for a more filling meal.",
    details:
      "A good pick when the customer wants a burger that eats like a main course.",
    image: images.burger,
    imageAlt: "Double burger with stacked patty",
    prices: [{ amount: "NGN 3,500" }],
    tags: ["Burger", "Protein"],
    ingredients: ["Double protein filling", "Burger bun", "House sauce"],
  },
  {
    id: "chicken-shawarma-regular",
    category: "sandwiches",
    name: "Chicken Shawarma Regular",
    description: "Chicken shawarma wrap with creamy sauce and vegetables.",
    details:
      "A dependable shawarma order for customers who want the classic chicken wrap.",
    image: images.sandwich,
    imageAlt: "Wrapped chicken sandwich with filling",
    prices: [{ amount: "NGN 4,000" }],
    tags: ["Shawarma", "Chicken"],
    ingredients: ["Chicken", "Flatbread", "Vegetables", "Creamy sauce"],
  },
  {
    id: "chicken-shawarma-special",
    category: "sandwiches",
    name: "Chicken Shawarma Special",
    description: "Bigger chicken shawarma with a richer filling.",
    details:
      "The stronger chicken shawarma option for customers who want a fuller wrap.",
    image: images.sandwich,
    imageAlt: "Chicken wrap cut open with vegetables",
    prices: [{ amount: "NGN 5,000" }],
    tags: ["Shawarma", "Special"],
    ingredients: ["Chicken", "Flatbread", "Vegetables", "Creamy sauce"],
  },
  {
    id: "beef-shawarma-regular",
    category: "sandwiches",
    name: "Beef Shawarma Regular",
    description: "Beef shawarma wrap with vegetables and sauce.",
    details:
      "A classic beef shawarma option with a warm wrap and savoury filling.",
    image: images.sandwich,
    imageAlt: "Beef shawarma style wrap",
    prices: [{ amount: "NGN 4,000" }],
    tags: ["Shawarma", "Beef"],
    ingredients: ["Beef", "Flatbread", "Vegetables", "Creamy sauce"],
  },
  {
    id: "beef-shawarma-special",
    category: "sandwiches",
    name: "Beef Shawarma Special",
    description: "Larger beef shawarma with extra serving weight.",
    details:
      "A more filling beef shawarma for customers who want the upgraded wrap.",
    image: images.sandwich,
    imageAlt: "Loaded shawarma wrap with sauce",
    prices: [{ amount: "NGN 5,000" }],
    tags: ["Shawarma", "Special"],
    ingredients: ["Beef", "Flatbread", "Vegetables", "Creamy sauce"],
  },
  {
    id: "shawarma-burger",
    category: "sandwiches",
    name: "Shawarma Burger",
    description: "A burger-style shawarma option for quick, compact eating.",
    details:
      "A newer menu pick that combines the flavour direction of shawarma with the hand-held feel of a burger.",
    image: images.sandwich,
    imageAlt: "Grilled wrap sandwich with seasoned filling",
    prices: [{ amount: "NGN 3,500" }],
    tags: ["New", "Shawarma"],
    ingredients: ["Shawarma filling", "Soft bread", "Vegetables", "Sauce"],
  },
  {
    id: "potato-fries-sandwich",
    category: "sandwiches",
    name: "Potato/Fries Sandwich",
    description: "French fries, coleslaw, and garlic sauce in a sandwich.",
    details:
      "A simple vegetarian-friendly fries sandwich with creamy crunch and garlic flavour.",
    image: images.sandwich,
    imageAlt: "Toasted wrap sandwich with fries filling",
    prices: [{ amount: "NGN 3,500" }],
    tags: ["Sandwich", "Fries"],
    ingredients: ["French fries", "Coleslaw", "Garlic sauce"],
  },
  {
    id: "fajita-sandwich",
    category: "sandwiches",
    name: "Fajita Sandwich",
    description: "Seasoned fajita-style filling in a warm sandwich.",
    details:
      "A savoury sandwich with fajita-style seasoning for customers who want a stronger flavour profile.",
    image: images.sandwich,
    imageAlt: "Fajita style wrap with seasoned filling",
    prices: [{ amount: "NGN 5,000" }],
    tags: ["Sandwich", "Fajita"],
    ingredients: ["Seasoned filling", "Vegetables", "Wrap", "Sauce"],
  },
  {
    id: "chicken-tabouk",
    category: "sandwiches",
    name: "Chicken Tabouk",
    description: "Seasoned chicken, coleslaw, garlic, and pickles.",
    details:
      "A sharp, creamy, and savoury chicken sandwich with the freshness of pickles and coleslaw.",
    image: images.sandwich,
    imageAlt: "Chicken sandwich wrap with vegetables",
    prices: [{ amount: "NGN 5,000" }],
    tags: ["Chicken", "Sandwich"],
    ingredients: ["Seasoned chicken", "Coleslaw", "Garlic", "Pickles"],
  },
  {
    id: "peppered-fried-chicken",
    category: "protein",
    name: "Peppered Fried Chicken",
    description: "Crispy fried chicken finished with peppered flavour.",
    details:
      "A bold protein order that works as a side with pizza, a snack plate, or a quick meal on its own.",
    image: images.friedChicken,
    imageAlt: "Crispy fried chicken pieces with sauce",
    prices: [{ amount: "NGN 3,500" }],
    tags: ["Protein", "Peppered"],
    ingredients: ["Fried chicken", "Pepper seasoning", "House spices"],
  },
  {
    id: "ice-cream-cone",
    category: "ice-cream",
    name: "Ice Cream Cone",
    description: "A crisp cone with your preferred available flavour.",
    details:
      "A quick cold treat for walk-ins, kids, and anyone who wants a simple ice cream order.",
    image: images.iceCream,
    imageAlt: "Scoops of ice cream in a cone",
    prices: [{ amount: "NGN 2,500" }],
    tags: ["Ice cream", "Cone"],
    ingredients: ["Cone", "Choice of available flavour"],
  },
  {
    id: "small-ice-cream-cup",
    category: "ice-cream",
    name: "Small Ice Cream Cup",
    description: "Two scoops served in a cup.",
    details:
      "A light cup serving for one person, with pricing based on selected scoop type.",
    image: images.iceCream,
    imageAlt: "Ice cream scoops in a cup",
    prices: [{ label: "2 scoops", amount: "NGN 3,500 / NGN 4,500" }],
    tags: ["Ice cream", "Cup"],
    ingredients: ["Two scoops", "Choice of available flavour"],
  },
  {
    id: "medium-ice-cream-cup",
    category: "ice-cream",
    name: "Medium Ice Cream Cup",
    description: "Three scoops for a fuller ice cream cup.",
    details:
      "A balanced cup size for customers who want variety without going jumbo.",
    image: images.iceCream,
    imageAlt: "Multiple ice cream scoops served cold",
    prices: [{ label: "3 scoops", amount: "NGN 4,500 / NGN 5,500" }],
    tags: ["Ice cream", "Cup"],
    ingredients: ["Three scoops", "Choice of available flavour"],
  },
  {
    id: "large-ice-cream-cup",
    category: "ice-cream",
    name: "Large Ice Cream Cup",
    description: "Four scoops for a generous cold dessert.",
    details:
      "A bigger cup for sharing lightly or for customers who want a full dessert order.",
    image: images.iceCream,
    imageAlt: "Large cup of colourful ice cream scoops",
    prices: [{ label: "4 scoops", amount: "NGN 7,000 / NGN 8,000" }],
    tags: ["Ice cream", "Large"],
    ingredients: ["Four scoops", "Choice of available flavour"],
  },
  {
    id: "jumbo-ice-cream",
    category: "ice-cream",
    name: "Jumbo Ice Cream",
    description: "Big plate serving for a full dessert experience.",
    details:
      "The largest ice cream option on the menu, best for customers who want a proper dessert plate.",
    image: images.iceCream,
    imageAlt: "Jumbo ice cream dessert serving",
    prices: [{ label: "Big plate", amount: "NGN 10,000" }],
    tags: ["Ice cream", "Jumbo"],
    ingredients: ["Large ice cream serving", "Choice of available flavour"],
  },
  ...[
    "Vanilla",
    "Strawberry",
    "Mix Fruit",
    "Chocolate",
    "Mango",
    "Creamy Milk",
    "Banana",
    "Bubble Gum",
    "Mars",
  ].map(
    (flavour): MenuItem => ({
      id: `ice-cream-${flavour.toLowerCase().replace(/\s+/g, "-")}`,
      category: "ice-cream",
      name: `${flavour} Ice Cream`,
      description: `${flavour} flavour available for cones and cup servings.`,
      details:
        "Choose this flavour with a cone or any cup size. Final price depends on the serving size selected.",
      image: images.iceCream,
      imageAlt: `${flavour} ice cream scoop`,
      prices: [{ amount: "Choose cone or cup size" }],
      tags: ["Flavour", "Ice cream"],
      ingredients: [flavour, "Ice cream base"],
    })
  ),
  ...["M&M", "Oreo", "Nuts", "Chocolate", "Edible Pearls"].map(
    (topping): MenuItem => ({
      id: `topping-${topping.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      category: "ice-cream",
      name: `${topping} Topping`,
      description: `Add ${topping} to your ice cream serving.`,
      details:
        "A simple add-on for customers who want more crunch, colour, or chocolate in their ice cream.",
      image: images.iceCream,
      imageAlt: `${topping} topping on ice cream`,
      prices: [{ amount: "NGN 500" }],
      tags: ["Topping", "Add-on"],
      ingredients: [topping],
    })
  ),
  {
    id: "meat-pie",
    category: "pastries",
    name: "Meat Pie",
    description: "Warm pastry with savoury meat filling.",
    details:
      "A bakery staple that works for breakfast, lunch breaks, and quick snack runs.",
    image: images.pastry,
    imageAlt: "Golden meat pie pastry",
    prices: [{ amount: "NGN 1,200" }],
    tags: ["Pastry", "Savoury"],
    ingredients: ["Pastry crust", "Meat filling"],
  },
  {
    id: "chicken-pie",
    category: "pastries",
    name: "Chicken Pie",
    description: "Golden pastry with chicken filling.",
    details:
      "A softer savoury pastry option for customers who prefer chicken over beef filling.",
    image: images.pastry,
    imageAlt: "Fresh savoury pie pastry",
    prices: [{ amount: "NGN 1,200" }],
    tags: ["Pastry", "Chicken"],
    ingredients: ["Pastry crust", "Chicken filling"],
  },
  {
    id: "jamaica-pie",
    category: "pastries",
    name: "Jamaica Pie",
    description: "Spiced savoury pie with a richer pastry profile.",
    details:
      "A more seasoned pastry for customers who want something bolder than the standard pie.",
    image: images.pastry,
    imageAlt: "Baked savoury hand pie",
    prices: [{ amount: "NGN 1,200" }],
    tags: ["Pastry", "Spiced"],
    ingredients: ["Pastry crust", "Seasoned filling"],
  },
  {
    id: "mini-pizza",
    category: "pastries",
    name: "Mini Pizza",
    description: "Small pizza-style pastry for quick snacking.",
    details:
      "A compact pizza bite for customers who want pizza flavour without ordering a full size.",
    image: images.pizza,
    imageAlt: "Mini pizza with cheese and toppings",
    prices: [{ amount: "NGN 2,000" }],
    tags: ["Pastry", "Pizza"],
    ingredients: ["Pizza dough", "Sauce", "Cheese", "Toppings"],
  },
  {
    id: "sable-biscuit",
    category: "pastries",
    name: "Sable Biscuit",
    description: "Crisp biscuit for a light bakery snack.",
    details:
      "A simple, budget-friendly biscuit order for tea breaks and light snacking.",
    image: images.pastry,
    imageAlt: "Crisp baked biscuit pastry",
    prices: [{ amount: "NGN 700" }],
    tags: ["Biscuit", "Bakery"],
    ingredients: ["Biscuit dough", "Bakery finish"],
  },
  {
    id: "cookies",
    category: "pastries",
    name: "Cookies",
    description: "Sweet bakery cookies with a crisp bite.",
    details:
      "A quick sweet option for customers who want something smaller than cake or doughnuts.",
    image: images.doughnut,
    imageAlt: "Sweet bakery treats and cookies",
    prices: [{ amount: "NGN 1,500" }],
    tags: ["Cookie", "Sweet"],
    ingredients: ["Cookie dough", "Sweet bakery finish"],
  },
  {
    id: "jam-doughnut",
    category: "pastries",
    name: "Jam Doughnut",
    description: "Soft doughnut with sweet jam filling.",
    details:
      "A familiar sweet pastry for customers who like a soft doughnut with a fruity centre.",
    image: images.doughnut,
    imageAlt: "Glazed doughnuts on a table",
    prices: [{ amount: "NGN 1,000" }],
    tags: ["Doughnut", "Sweet"],
    ingredients: ["Doughnut dough", "Jam filling"],
  },
  {
    id: "chocolate-doughnut",
    category: "pastries",
    name: "Chocolate Doughnut",
    description: "Soft doughnut with chocolate finish.",
    details:
      "A richer doughnut option for chocolate lovers who want a sweet bakery treat.",
    image: images.doughnut,
    imageAlt: "Chocolate glazed doughnuts",
    prices: [{ amount: "NGN 1,500" }],
    tags: ["Doughnut", "Chocolate"],
    ingredients: ["Doughnut dough", "Chocolate finish"],
  },
  {
    id: "milky-doughnut",
    category: "pastries",
    name: "Milky Doughnut",
    description: "Soft doughnut with a creamy milk-style finish.",
    details:
      "A smooth and sweet doughnut for customers who prefer a creamier pastry profile.",
    image: images.doughnut,
    imageAlt: "Creamy glazed doughnuts",
    prices: [{ amount: "NGN 1,500" }],
    tags: ["Doughnut", "Creamy"],
    ingredients: ["Doughnut dough", "Milky cream finish"],
  },
  {
    id: "combo-chops",
    category: "chops",
    name: "Combo Chops",
    description: "Spring roll, samosa, and puff puff in one snack combo.",
    details:
      "A compact small-chops mix for customers who want variety in one order.",
    image: images.chops,
    imageAlt: "Small chops with samosa and spring roll",
    prices: [{ amount: "NGN 1,500" }],
    tags: ["Chops", "Combo"],
    ingredients: ["Spring roll", "Samosa", "Puff puff"],
  },
  {
    id: "samosa",
    category: "chops",
    name: "Samosa",
    description: "Crisp triangular small chop with savoury filling.",
    details:
      "A classic party snack and quick bite that pairs well with cold drinks.",
    image: images.chops,
    imageAlt: "Crispy samosa small chops",
    prices: [{ amount: "NGN 350" }],
    tags: ["Chops", "Snack"],
    ingredients: ["Pastry wrap", "Savoury filling"],
  },
  {
    id: "spring-rolls",
    category: "chops",
    name: "Spring Rolls",
    description: "Crisp rolls with seasoned vegetable-style filling.",
    details:
      "A familiar small-chops order for parties, office snacks, and quick sides.",
    image: images.chops,
    imageAlt: "Golden spring rolls on a plate",
    prices: [{ amount: "NGN 400" }],
    tags: ["Chops", "Rolls"],
    ingredients: ["Roll wrapper", "Seasoned filling"],
  },
  {
    id: "puff-puff",
    category: "chops",
    name: "Puff Puff",
    description: "Soft fried dough ball with a lightly sweet bite.",
    details:
      "A simple Nigerian snack for customers who want something warm, soft, and affordable.",
    image: images.chops,
    imageAlt: "Fried small chops served together",
    prices: [{ amount: "NGN 100" }],
    tags: ["Chops", "Snack"],
    ingredients: ["Fried dough", "Light sugar"],
  },
  {
    id: "veggie-pizza",
    category: "pizza",
    name: "Veggie Pizza",
    description: "Sauce, sweet corn, mushroom, onion ring, green pepper, olive seed.",
    details:
      "A vegetable-forward pizza for customers who want colour, crunch, and lighter toppings.",
    image: images.pizza,
    imageAlt: "Vegetable pizza with cheese and toppings",
    prices: regularPizzaPrices(),
    tags: ["Pizza", "Regular"],
    ingredients: ["Sauce", "Sweet corn", "Mushroom", "Onion ring", "Green pepper", "Olive seed"],
  },
  {
    id: "chicken-pizza",
    category: "pizza",
    name: "Chicken Pizza",
    description: "Sauce, chicken, onion ring, and sausage.",
    details:
      "A regular pizza built around chicken and sausage for a familiar crowd-friendly choice.",
    image: images.pizza,
    imageAlt: "Chicken pizza with melted cheese",
    prices: regularPizzaPrices(),
    tags: ["Pizza", "Regular"],
    ingredients: ["Sauce", "Chicken", "Onion ring", "Sausage"],
  },
  {
    id: "beef-pizza",
    category: "pizza",
    name: "Beef Pizza",
    description: "Sauce, beef, onion ring, and sausage.",
    details:
      "A savoury beef pizza for customers who want a meaty regular pizza option.",
    image: images.pizza,
    imageAlt: "Beef pizza with cheese and toppings",
    prices: regularPizzaPrices(),
    tags: ["Pizza", "Regular"],
    ingredients: ["Sauce", "Beef", "Onion ring", "Sausage"],
  },
  {
    id: "pepperoni-pizza",
    category: "pizza",
    name: "Pepperoni Pizza",
    description: "Sauce, cheese, and pepperoni.",
    details:
      "A classic special pizza for customers who want a bold pepperoni topping and melted cheese.",
    image: images.pizza,
    imageAlt: "Pepperoni pizza with melted cheese",
    prices: specialPizzaPrices(),
    tags: ["Pizza", "Special"],
    ingredients: ["Sauce", "Cheese", "Pepperoni"],
  },
  {
    id: "shrimp-pizza",
    category: "pizza",
    name: "Shrimp Pizza",
    description: "Sauce, shrimp, sweet corn, and cheese.",
    details:
      "A seafood-leaning special pizza with sweet corn and cheese for a richer topping mix.",
    image: images.pizza,
    imageAlt: "Seafood pizza with cheese",
    prices: specialPizzaPrices(),
    tags: ["Pizza", "Special"],
    ingredients: ["Sauce", "Shrimp", "Sweet corn", "Cheese"],
  },
  {
    id: "super-mix-pizza",
    category: "pizza",
    name: "Super Mix Pizza",
    description: "Chicken, beef, sweet corn, onion ring, and green pepper.",
    details:
      "A loaded special pizza for groups that want both chicken and beef on one order.",
    image: images.pizza,
    imageAlt: "Loaded pizza with mixed toppings",
    prices: specialPizzaPrices(),
    tags: ["Pizza", "Special"],
    ingredients: ["Chicken", "Beef", "Sweet corn", "Onion ring", "Green pepper"],
  },
  {
    id: "fajita-pizza",
    category: "pizza",
    name: "Fajita Pizza",
    description: "Sauce, chicken, onion ring, and green pepper.",
    details:
      "A chicken special pizza with fajita-style direction and vegetable crunch.",
    image: images.pizza,
    imageAlt: "Chicken fajita pizza with green pepper",
    prices: specialPizzaPrices(),
    tags: ["Pizza", "Special"],
    ingredients: ["Sauce", "Chicken", "Onion ring", "Green pepper"],
  },
  {
    id: "suya-pizza",
    category: "pizza",
    name: "Suya Pizza",
    description: "Sauce, beef suya, and onion ring.",
    details:
      "A Nigerian-inspired special pizza with beef suya flavour and onion ring topping.",
    image: images.pizza,
    imageAlt: "Pizza with beef toppings and onions",
    prices: specialPizzaPrices(),
    tags: ["Pizza", "Special"],
    ingredients: ["Sauce", "Beef suya", "Onion ring"],
  },
] as const;

function parseNairaLabelToMinorUnits(input: string): number {
  const normalized = input.replace(/NGN/gi, "").replace(/,/g, "").trim();
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid NGN amount label: ${input}`);
  }

  return Math.round(amount * 100);
}

function expandReferencePrices(
  itemId: string,
  prices: readonly MenuPriceSeed[],
): Array<{
  id: string;
  label: string | null;
  amount: number;
  sortOrder: number;
}> {
  const fallbackIceCreamRows = [
    { label: "2 scoops - Option 1", amount: "NGN 3,500" },
    { label: "2 scoops - Option 2", amount: "NGN 4,500" },
    { label: "3 scoops - Option 1", amount: "NGN 4,500" },
    { label: "3 scoops - Option 2", amount: "NGN 5,500" },
    { label: "4 scoops - Option 1", amount: "NGN 7,000" },
    { label: "4 scoops - Option 2", amount: "NGN 8,000" },
    { label: "Big plate", amount: "NGN 10,000" },
  ] satisfies MenuPriceSeed[];

  return prices.flatMap((price, priceIndex) => {
    if (/choose cone or cup size/i.test(price.amount)) {
      return fallbackIceCreamRows.map((fallbackPrice, fallbackIndex) => ({
        id: `${itemId}-price-${priceIndex + 1}-${fallbackIndex + 1}`,
        label: fallbackPrice.label ?? null,
        amount: parseNairaLabelToMinorUnits(fallbackPrice.amount),
        sortOrder: priceIndex + fallbackIndex,
      }));
    }

    if (price.amount.includes("/")) {
      return price.amount.split("/").map((amountPart, amountIndex) => ({
        id: `${itemId}-price-${priceIndex + 1}-${amountIndex + 1}`,
        label: price.label
          ? `${price.label} - Option ${amountIndex + 1}`
          : `Option ${amountIndex + 1}`,
        amount: parseNairaLabelToMinorUnits(amountPart.trim()),
        sortOrder: priceIndex + amountIndex,
      }));
    }

    return [
      {
        id: `${itemId}-price-${priceIndex + 1}`,
        label: price.label ?? null,
        amount: parseNairaLabelToMinorUnits(price.amount),
        sortOrder: priceIndex,
      },
    ];
  });
}

export const defaultTabularMenuContent: TabularMenuContentValue = {
  categories: categories.map((category, index) => ({
    id: category.id,
    label: category.label,
    summary: category.summary,
    sortOrder: index,
  })),
  items: baseMenuItems.map((item, index) => ({
    id: item.id,
    categoryId: item.category,
    name: item.name,
    description: item.description,
    details: item.details,
    imageUrl: item.image,
    imageAlt: item.imageAlt,
    prices: expandReferencePrices(item.id, item.prices),
    tags: [...item.tags],
    ingredients: item.ingredients ? [...item.ingredients] : [],
    sortOrder: index,
  })),
};

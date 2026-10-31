// The recipe catalog.
//
// This is the source of truth for the collection. Production deployments can
// move this behind an HTTP endpoint (e.g. a Worker) and have the browser call
// it through src/lib/apiClient.ts instead of importing it directly — the
// recipeApi module below keeps that boundary intact either way.

import type { Recipe } from "../../../shared/recipe";
import { validateRecipe } from "../../../shared/recipe";

export const recipeCatalog: Recipe[] = [
  {
    id: "classic-marginara-eggs",
    title: "Classic Carbonara",
    category: "dinner",
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 2,
    difficulty: "Medium",
    summary:
      "Creamy egg-and-cheese pasta with pancetta, black pepper, and Parmesan — no cream, just technique.",
    ingredients: [
      { amount: "340", unit: "g", title: "Spaghetti" },
      { amount: "120", unit: "g", title: "Pancetta or guanciale, diced" },
      { amount: "3", unit: "", title: "Egg yolks" },
      { amount: "1", unit: "", title: "Whole egg" },
      { amount: "60", unit: "g", title: "Pecorino Romano, grated" },
      { amount: "30", unit: "g", title: "Parmesan, grated" },
      { amount: "1", unit: "tbsp", title: "Black pepper, freshly ground" },
      { amount: "", unit: "", title: "Salt, for the water" },
    ],
    steps: [
      "Bring a large pot of generously salted water to a boil and cook the spaghetti until just al dente.",
      "Meanwhile, cook the pancetta in a cold pan over medium heat until golden and crisp. Reserve a little fat in the pan.",
      "In a bowl, whisk the egg yolks, whole egg, and both cheeses until smooth. Add a generous amount of black pepper.",
      "Drain the pasta, keeping a cup of the starchy water. Toss the hot pasta into the pan with the pancetta.",
      "Remove the pan from the heat and quickly fold in the egg mixture, tossing constantly. Add splashes of pasta water to keep it silky.",
      "Serve immediately with extra pepper and cheese on top.",
    ],
    tags: ["italian", "pasta", "quick"],
  },
  {
    id: "scrambled-free-range",
    title: "Buttery Scrambled Eggs",
    category: "breakfast",
    prepMinutes: 2,
    cookMinutes: 5,
    servings: 1,
    difficulty: "Easy",
    summary:
      "Slow, gentle scrambled eggs with butter and chives — low effort, maximum flavor.",
    ingredients: [
      { amount: "3", unit: "", title: "Eggs" },
      { amount: "1", unit: "tbsp", title: "Salted butter" },
      { amount: "2", unit: "tbsp", title: "Milk or cream" },
      { amount: "2", unit: "tbsp", title: "Chives, chopped" },
      { amount: "1", unit: "pinch", title: "Black pepper" },
    ],
    steps: [
      "Whisk the eggs with the milk, a pinch of salt, and pepper in a warm bowl.",
      "Melt the butter over low heat in a non-stick pan.",
      "Pour in the eggs and push gently with a spatula, letting them set for a few seconds.",
      "Keep stirring softly and remove the pan from the heat just before they look done — they keep cooking.",
      "Fold in the chives and serve on warm toast.",
    ],
    tags: ["breakfast", "vegetarian", "quick"],
  },
  {
    id: "tomato-basil-soup",
    title: "Roasted Tomato Basil Soup",
    category: "lunch",
    prepMinutes: 10,
    cookMinutes: 40,
    servings: 4,
    difficulty: "Easy",
    summary:
      "Sweet roasted tomatoes, garlic, and basil blended into a velvety, herb-kissed soup.",
    ingredients: [
      { amount: "800", unit: "g", title: "Roma tomatoes, halved" },
      { amount: "4", unit: "cloves", title: "Garlic" },
      { amount: "200", unit: "ml", title: "Vegetable stock" },
      { amount: "80", unit: "ml", title: "Olive oil" },
      { amount: "30", unit: "g", title: "Fresh basil, leaves" },
      { amount: "40", unit: "g", title: "Parmesan, grated" },
      { amount: "1", unit: "", title: "Salt to taste" },
    ],
    steps: [
      "Toss the tomatoes and garlic with olive oil and roast at 220°C for 30 minutes until caramelized.",
      "Add the stock and simmer for another 10 minutes.",
      "Stir in the basil and blend until smooth.",
      "Season with salt, drizzle with olive oil, and top with parmesan.",
    ],
    tags: ["vegetarian", "soup", "comfort"],
  },
  {
    id: "lemon-herb-salmon",
    title: "Lemon Herb Salmon",
    category: "dinner",
    prepMinutes: 8,
    cookMinutes: 14,
    servings: 2,
    difficulty: "Easy",
    summary:
      "Pan-seared salmon with a bright lemon-herb crust — ready in under 25 minutes.",
    ingredients: [
      { amount: "2", unit: " fillets", title: "Salmon" },
      { amount: "1", unit: "lemon", title: "Juiced and zested" },
      { amount: "2", unit: "tbsp", title: "Dijon mustard" },
      { amount: "2", unit: "tbsp", title: "Fresh dill, chopped" },
      { amount: "1", unit: "clove", title: "Garlic" },
      { amount: "1", unit: "tbsp", title: "Olive oil" },
      { amount: "1", unit: "pinch", title: "Flaky salt" },
    ],
    steps: [
      "Pat the salmon dry and season both sides with salt.",
      "Mix the mustard, lemon zest, dill, minced garlic, and a little lemon juice into a paste.",
      "Heat the oil in a non-stick pan over medium-high heat.",
      "Sear the salmon skin-side down for 4 minutes, then flip and cook 3 more minutes.",
      "Spread the mustard paste over the top during the last minute and squeeze fresh lemon on top.",
    ],
    tags: ["fish", "quick", "gluten-free"],
  },
  {
    id: "greek-greek-salad",
    title: "Greek Village Salad",
    category: "lunch",
    prepMinutes: 15,
    cookMinutes: 0,
    servings: 2,
    difficulty: "Easy",
    summary:
      "Crisp vegetables, Kalamata olives, and feta in a simple oregano-dressed vinaigrette.",
    ingredients: [
      { amount: "1", unit: "head", title: "Green cabbage, shredded" },
      { amount: "1", unit: "cucumber, diced", title: "" },
      { amount: "1", unit: "tomato, diced", title: "" },
      { amount: "1", unit: "red onion, sliced", title: "" },
      { amount: "100", unit: "g", title: "Feta, cubed" },
      { amount: "60", unit: "g", title: "Kalamata olives" },
      { amount: "3", unit: "tbsp", title: "Olive oil" },
      { amount: "1", unit: "tbsp", title: "Red wine vinegar" },
    ],
    steps: [
      "Combine the cabbage, cucumber, tomato, and red onion in a large bowl.",
      "Whisk the olive oil and vinegar with salt and a grind of pepper.",
      "Toss the salad, top with feta and olives, and let it rest 10 minutes before serving.",
    ],
    tags: ["vegetarian", "salad", "meal-prep"],
  },
  {
    id: "chocolate-lava-cake",
    title: "Molten Chocolate Lava Cake",
    category: "dessert",
    prepMinutes: 15,
    cookMinutes: 12,
    servings: 4,
    difficulty: "Advanced",
    summary:
      "Individual rich chocolate cakes with a warm, flowing center — a showstopper dessert.",
    ingredients: [
      { amount: "200", unit: "g", title: "Dark chocolate (70%)" },
      { amount: "100", unit: "g", title: "Butter" },
      { amount: "4", unit: "", title: "Egg yolks" },
      { amount: "2", unit: "", title: "Whole eggs" },
      { amount: "100", unit: "g", title: "Sugar" },
      { amount: "50", unit: "g", title: "All-purpose flour" },
      { amount: "2", unit: "tbsp", title: "Cocoa powder, for dusting" },
    ],
    steps: [
      "Melt the chocolate and butter together, then set aside to cool slightly.",
      "Whisk the eggs and sugar until thick and pale, about 3 minutes.",
      "Fold in the chocolate mixture, then gently stir in the flour.",
      "Butter and dust four ramekins, divide the batter, and bake at 220°C for 10–12 minutes.",
      "The edges should be set but the center still jiggles.",
      "Invert onto plates and serve immediately with vanilla ice cream.",
    ],
    tags: ["chocolate", "baking", "special"],
  },
  {
    id: "avocado-toast",
    title: "Avocado Toast",
    category: "breakfast",
    prepMinutes: 5,
    cookMinutes: 4,
    servings: 1,
    difficulty: "Easy",
    summary:
      "Creamy smashed avocado on crispy sourdough with a squeeze of lemon.",
    ingredients: [
      { amount: "1", unit: "ripe", title: "Avocado" },
      { amount: "1", unit: "slice", title: "Sourdough, thick" },
      { amount: "1", unit: "clove", title: "Garlic" },
      { amount: "1", unit: "lemon", title: "Juiced" },
      { amount: "1", unit: "pinch", title: "Red pepper flakes" },
      { amount: "", unit: "", title: "Salt and pepper" },
    ],
    steps: [
      "Toast the sourdough until golden and crisp.",
      "Mash the avocado with garlic, lemon juice, salt, and pepper.",
      "Rub the toast with a cut clove of garlic.",
      "Spread the avocado over the toast and finish with pepper flakes.",
    ],
    tags: ["vegetarian", "quick", "breakfast"],
  },
  {
    id: "chickpea-curry",
    title: "Creamy Chickpea Curry",
    category: "dinner",
    prepMinutes: 10,
    cookMinutes: 25,
    servings: 3,
    difficulty: "Easy",
    summary:
      "Warm, spiced chickpeas in a silky tomato sauce — vegetarian, filling, and easy to scale.",
    ingredients: [
      { amount: "400", unit: "g", title: "Canned chickpeas, drained" },
      { amount: "400", unit: "g", title: "Canned tomatoes" },
      { amount: "1", unit: "onion, diced", title: "" },
      { amount: "2", unit: "cloves", title: "Garlic" },
      { amount: "1", unit: "in", title: "Ginger" },
      { amount: "2", unit: "tbsp", title: "Tomato paste" },
      { amount: "1", unit: "tbsp", title: "Cumin" },
      { amount: "1", unit: "tbsp", title: "Coriander" },
    ],
    steps: [
      "Sauté the onion, garlic, and ginger until soft in a little oil.",
      "Add the cumin and coriander and toast for a minute.",
      "Stir in the tomato paste, then add the tomatoes and simmer 15 minutes.",
      "Add the chickpeas and a splash of water, cook 10 more minutes until thick.",
      "Season, garnish with coriander, and serve with rice or naan.",
    ],
    tags: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    id: "honey-oat-energy-bars",
    title: "Honey Oat Energy Bars",
    category: "snack",
    prepMinutes: 10,
    cookMinutes: 0,
    servings: 8,
    difficulty: "Easy",
    summary:
      "No-bake chewy bars of oats, honey, and nuts — perfect for meal prep.",
    ingredients: [
      { amount: "200", unit: "g", title: "Oats" },
      { amount: "100", unit: "g", title: "Peanut butter" },
      { amount: "80", unit: "ml", title: "Honey" },
      { amount: "50", unit: "g", title: "Shredded coconut" },
      { amount: "40", unit: "g", title: "Chopped dark chocolate" },
      { amount: "1", unit: "tbsp", title: "Ground flaxseed" },
    ],
    steps: [
      "Melt the honey with a splash of warm water.",
      "Mix the oats, peanut butter, honey, flaxseed, and coconut in a bowl until combined.",
      "Fold in the chopped chocolate.",
      "Press firmly into a lined tray and refrigerate for at least 1 hour.",
      "Cut into 8 bars and store in the fridge.",
    ],
    tags: ["no-bake", "vegetarian", "meal-prep"],
  },
  {
    id: "garlic-butter-shrimp",
    title: "Garlic Butter Shrimp",
    category: "dinner",
    prepMinutes: 8,
    cookMinutes: 8,
    servings: 2,
    difficulty: "Easy",
    summary:
      "Tender shrimp in fragrant garlic butter with parsley and a squeeze of lemon.",
    ingredients: [
      { amount: "400", unit: "g", title: "Large shrimp, peeled" },
      { amount: "60", unit: "g", title: "Butter" },
      { amount: "4", unit: "cloves", title: "Garlic, minced" },
      { amount: "2", unit: "tbsp", title: "Parsley, chopped" },
      { amount: "1", unit: "lemon", title: "Juiced" },
      { amount: "1", unit: "pinch", title: "Red pepper flakes" },
    ],
    steps: [
      "Toss the shrimp with salt, pepper, and red pepper flakes.",
      "Melt the butter over medium heat and add the garlic.",
      "Cook the shrimp 2 minutes per side until pink and just curled.",
      "Stir in the parsley and lemon juice and serve with pasta or crusty bread.",
    ],
    tags: ["seafood", "quick", "gluten-free"],
  },
  {
    id: "mint-chocolate-mousse",
    title: "Mint Chocolate Mousse",
    category: "dessert",
    prepMinutes: 10,
    cookMinutes: 0,
    servings: 4,
    difficulty: "Medium",
    summary:
      "Light, airy chocolate mousse with a cool mint finish and white-chocolate chips.",
    ingredients: [
      { amount: "200", unit: "g", title: "Dark chocolate, melted" },
      { amount: "4", unit: "", title: "Egg whites" },
      { amount: "60", unit: "g", title: "Sugar" },
      { amount: "1", unit: "tsp", title: "Mint extract" },
      { amount: "40", unit: "g", title: "White chocolate chips" },
    ],
    steps: [
      "Whip the egg whites with sugar to stiff peaks.",
      "Gently fold in the melted chocolate and mint extract.",
      "Fold in the white chocolate chips.",
      "Spoon into glasses and chill at least 1 hour.",
      "Dust with cocoa and extra chocolate chips before serving.",
    ],
    tags: ["chocolate", "no-bake", "special"],
  },
];

// The browser reads recipes through this module so the UI never imports the
// catalog directly. This keeps the "data source" boundary clean and makes it
// easy to swap the catalog for a real HTTP endpoint later.
export const recipesApi = {
  list(): Promise<Recipe[]> {
    return Promise.resolve(
      recipeCatalog
        .map(validateRecipe)
        .filter((recipe): recipe is Recipe => recipe !== null),
    );
  },

  byId(id: string): Promise<Recipe | null> {
    return this.list().then(
      (recipes) => recipes.find((recipe) => recipe.id === id) ?? null,
    );
  },
};

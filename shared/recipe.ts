// Shared recipe contract and its explicit validator.
//
// This module is the single source of truth for the recipe shape used across
// the browser (features, pages, components). It intentionally avoids a schema
// framework: the model is small enough that an explicit validator is clearer
// and cheaper than introducing another dependency.

export type RecipeCategory =
  "breakfast" | "lunch" | "dinner" | "dessert" | "snack";

export type RecipeDifficulty = "Easy" | "Medium" | "Advanced";

export interface RecipeIngredient {
  title: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  category: RecipeCategory;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  summary: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
}

const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  breakfast: "Ontbijt",
  lunch: "Lunch",
  dinner: "Diner",
  dessert: "Dessert",
  snack: "Tussendoor",
};

const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  Easy: "Makkelijk",
  Medium: "Gemiddeld",
  Advanced: "Gevorderd",
};

export const recipeCategories: RecipeCategory[] = [
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "snack",
];

export const recipeCategoryLabels: Record<RecipeCategory, string> =
  CATEGORY_LABELS;

export const recipeDifficulties: RecipeDifficulty[] = [
  "Easy",
  "Medium",
  "Advanced",
];

export const recipeDifficultyLabels: Record<RecipeDifficulty, string> =
  DIFFICULTY_LABELS;

export function recipeCategoryLabel(category: RecipeCategory): string {
  return CATEGORY_LABELS[category];
}

export function recipeDifficultyLabel(difficulty: RecipeDifficulty): string {
  return DIFFICULTY_LABELS[difficulty];
}

export interface RecipeErrors {
  title?: string;
  category?: string;
  prepMinutes?: string;
  cookMinutes?: string;
  servings?: string;
  difficulty?: string;
  ingredients?: string;
  steps?: string;
}

export function validateRecipe(input: unknown): Recipe | null {
  const source = asRecord(input);
  if (!source) {
    return null;
  }

  const title = String(source.title ?? "").trim();
  if (!title || title.length > 120) {
    return null;
  }

  const category = source.category as RecipeCategory;
  if (!recipeCategories.includes(category)) {
    return null;
  }

  const prepMinutes = asNonNegativeInteger(source.prepMinutes);
  if (prepMinutes === null) {
    return null;
  }

  const cookMinutes = asNonNegativeInteger(source.cookMinutes);
  if (cookMinutes === null) {
    return null;
  }

  const servings = asPositiveInteger(source.servings);
  if (servings === null) {
    return null;
  }

  const difficulty = source.difficulty as RecipeDifficulty;
  if (!recipeDifficulties.includes(difficulty)) {
    return null;
  }

  const ingredientValues = Array.isArray(source.ingredients)
    ? source.ingredients.map(asIngredient)
    : [];
  if (
    ingredientValues.length === 0 ||
    ingredientValues.some((ingredient) => ingredient === null)
  ) {
    return null;
  }
  const ingredients = ingredientValues.filter(
    (ingredient): ingredient is RecipeIngredient => ingredient !== null,
  );

  const steps = Array.isArray(source.steps)
    ? source.steps.map((step) => String(step ?? "").trim())
    : [];
  if (steps.length === 0 || steps.some((step) => step.length === 0)) {
    return null;
  }

  const tags: string[] = Array.isArray(source.tags)
    ? source.tags.filter(
        (tag): tag is string =>
          typeof tag === "string" && tag.trim().length > 0,
      )
    : [];

  return {
    id: String(source.id),
    title,
    category,
    prepMinutes,
    cookMinutes,
    servings,
    difficulty,
    summary: String(source.summary ?? "").trim(),
    ingredients,
    steps,
    tags,
  };
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return null;
}

function asIngredient(input: unknown): RecipeIngredient | null {
  if (input && typeof input === "object") {
    const source = input as Record<string, unknown>;
    const title = String(source.title ?? "").trim();
    if (!title) {
      return null;
    }
    return {
      title,
      amount: String(source.amount ?? "").trim(),
      unit: String(source.unit ?? "").trim(),
    };
  }
  return null;
}

function asNonNegativeInteger(input: unknown): number | null {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    return null;
  }
  if (!Number.isInteger(input) || input < 0) {
    return null;
  }
  return input;
}

function asPositiveInteger(input: unknown): number | null {
  const value = asNonNegativeInteger(input);
  return value === null || value < 1 ? null : value;
}

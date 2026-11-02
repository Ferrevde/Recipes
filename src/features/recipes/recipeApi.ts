import type { Recipe } from "../../../shared/recipe";
import { validateRecipe } from "../../../shared/recipe";
import { recipeCatalog } from "./recipeCatalog";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const LEGACY_STORAGE_KEY = "recipes.customRecipes";
export type RecipeInput = Omit<Recipe, "id">;

function remoteUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function readRecipeResponse(response: Response): Promise<Recipe[]> {
  if (!response.ok) {
    throw new Error(`De receptenservice gaf ${response.status}.`);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error("De receptenservice gaf an invalid response.");
  }
  return body
    .map(validateRecipe)
    .filter((recipe): recipe is Recipe => recipe !== null);
}

function mergeRecipes(remoteRecipes: Recipe[]): Recipe[] {
  const byId = new Map(recipeCatalog.map((recipe) => [recipe.id, recipe]));
  for (const recipe of remoteRecipes) {
    byId.set(recipe.id, recipe);
  }
  return [...byId.values()];
}

async function storedRecipe(id: string): Promise<Recipe | null> {
  const response = await fetch(
    remoteUrl(`/api/recipes/${encodeURIComponent(id)}`),
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`De receptenservice gaf ${response.status}.`);
  }
  return validateRecipe(await response.json());
}

export const recipesApi = {
  async list(): Promise<Recipe[]> {
    try {
      await migrateLegacyRecipes();
      return mergeRecipes(
        await readRecipeResponse(await fetch(remoteUrl("/api/recipes"))),
      );
    } catch {
      return recipeCatalog;
    }
  },

  async byId(id: string): Promise<Recipe | null> {
    try {
      return (
        (await storedRecipe(id)) ??
        recipeCatalog.find((recipe) => recipe.id === id) ??
        null
      );
    } catch {
      return recipeCatalog.find((recipe) => recipe.id === id) ?? null;
    }
  },

  async storedById(id: string): Promise<Recipe | null> {
    return storedRecipe(id);
  },

  async importFromUrl(url: string): Promise<RecipeInput> {
    const response = await fetch(remoteUrl("/api/import"), {
      body: JSON.stringify({ url }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message =
        body && typeof body === "object" && "error" in body
          ? String(body.error)
          : "Het recept kon niet worden geïmporteerd.";
      throw new Error(message);
    }
    const recipe = validateRecipe({
      id: "import-preview",
      ...(await response.json()),
    });
    if (!recipe) {
      throw new Error("De import gaf geen geldig recept terug.");
    }
    const { id: _id, ...input } = recipe;
    return input;
  },

  async importFromImage(image: File): Promise<RecipeInput> {
    const form = new FormData();
    form.set("image", image);
    const response = await fetch(remoteUrl("/api/import-image"), {
      body: form,
      method: "POST",
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message =
        body && typeof body === "object" && "error" in body
          ? String(body.error)
          : "De screenshot kon niet worden geïmporteerd.";
      throw new Error(message);
    }
    const recipe = validateRecipe({
      id: "image-preview",
      ...(await response.json()),
    });
    if (!recipe) {
      throw new Error("De screenshot gaf geen geldig recept terug.");
    }
    const { id: _id, ...input } = recipe;
    return input;
  },

  async create(input: RecipeInput): Promise<Recipe> {
    return sendRecipe("POST", "/api/recipes", input);
  },

  async update(id: string, input: RecipeInput): Promise<Recipe> {
    return sendRecipe("PUT", `/api/recipes/${encodeURIComponent(id)}`, input);
  },

  async remove(id: string): Promise<void> {
    const response = await fetch(
      remoteUrl(`/api/recipes/${encodeURIComponent(id)}`),
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      throw new Error(`De receptenservice gaf ${response.status}.`);
    }
  },
};

async function migrateLegacyRecipes(): Promise<void> {
  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return;
  let legacyRecipes: Recipe[];
  try {
    const parsed: unknown = JSON.parse(raw);
    legacyRecipes = Array.isArray(parsed)
      ? parsed
          .map(validateRecipe)
          .filter((recipe): recipe is Recipe => recipe !== null)
      : [];
  } catch {
    return;
  }
  if (legacyRecipes.length === 0) {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return;
  }
  for (const recipe of legacyRecipes) {
    const { id: _id, ...input } = recipe;
    await sendRecipe("POST", "/api/recipes", input);
  }
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

async function sendRecipe(
  method: "POST" | "PUT",
  path: string,
  input: RecipeInput,
): Promise<Recipe> {
  const response = await fetch(remoteUrl(path), {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method,
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "error" in body
        ? String(body.error)
        : `De receptenservice gaf ${response.status}.`;
    throw new Error(message);
  }
  const recipe = validateRecipe(await response.json());
  if (!recipe) {
    throw new Error("De receptenservice gaf an invalid recipe.");
  }
  return recipe;
}

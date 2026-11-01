import type { Recipe } from "../../../shared/recipe";
import { validateRecipe } from "../../../shared/recipe";
import { recipeCatalog } from "./recipeCatalog";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function remoteUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function readRecipeResponse(response: Response): Promise<Recipe[]> {
  if (!response.ok) {
    throw new Error(`Recipe service returned ${response.status}.`);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error("Recipe service returned an invalid response.");
  }
  return body
    .map(validateRecipe)
    .filter((recipe): recipe is Recipe => recipe !== null);
}

async function remoteList(): Promise<Recipe[]> {
  const response = await fetch(remoteUrl("/api/recipes"));
  return readRecipeResponse(response);
}

function mergeRecipes(remoteRecipes: Recipe[]): Recipe[] {
  const byId = new Map(recipeCatalog.map((recipe) => [recipe.id, recipe]));
  for (const recipe of remoteRecipes) {
    byId.set(recipe.id, recipe);
  }
  return [...byId.values()];
}

export const recipesApi = {
  async list(): Promise<Recipe[]> {
    if (!API_BASE) {
      return recipeCatalog;
    }
    try {
      return mergeRecipes(await remoteList());
    } catch {
      return recipeCatalog;
    }
  },

  async byId(id: string): Promise<Recipe | null> {
    if (!API_BASE) {
      return recipeCatalog.find((recipe) => recipe.id === id) ?? null;
    }
    try {
      const response = await fetch(
        remoteUrl(`/api/recipes/${encodeURIComponent(id)}`),
      );
      if (response.status === 404) {
        return recipeCatalog.find((recipe) => recipe.id === id) ?? null;
      }
      const body: unknown = await response.json();
      return validateRecipe(body);
    } catch {
      return recipeCatalog.find((recipe) => recipe.id === id) ?? null;
    }
  },

  async create(input: Omit<Recipe, "id">): Promise<Recipe> {
    if (!API_BASE) {
      throw new Error("Recipe storage is not configured for this environment.");
    }
    const response = await fetch(remoteUrl("/api/recipes"), {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message =
        body && typeof body === "object" && "error" in body
          ? String(body.error)
          : `Recipe service returned ${response.status}.`;
      throw new Error(message);
    }
    const recipe = validateRecipe(await response.json());
    if (!recipe) {
      throw new Error("Recipe service returned an invalid recipe.");
    }
    return recipe;
  },
};

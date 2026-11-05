import type { Recipe, RecipeInput } from "@shared/recipe";
import { validateRecipe } from "@shared/recipe";

export interface RecipeService {
  list(): Promise<Recipe[]>;
  get(id: string): Promise<Recipe | null>;
  create(input: RecipeInput): Promise<Recipe>;
  update(id: string, input: RecipeInput): Promise<Recipe>;
  delete(id: string): Promise<void>;
}

export function createRecipeService(db: D1Database): RecipeService {
  return {
    async list() {
      const { listRecipes } = await import("../db/recipes");
      return listRecipes(db);
    },
    async get(id: string) {
      const { getRecipe } = await import("../db/recipes");
      return getRecipe(db, id);
    },
    async create(input: RecipeInput) {
      const { createRecipe } = await import("../db/recipes");
      const recipe = validateRecipe({ id: crypto.randomUUID(), ...input });
      if (!recipe) throw new Error("Ongeldig recept");
      await createRecipe(db, recipe);
      return recipe;
    },
    async update(id: string, input: RecipeInput) {
      const { updateRecipe } = await import("../db/recipes");
      const recipe = validateRecipe({ id, ...input });
      if (!recipe) throw new Error("Ongeldig recept");
      const ok = await updateRecipe(db, id, recipe);
      if (!ok) throw new Error("Recept niet gevonden");
      return recipe;
    },
    async delete(id: string) {
      const { deleteRecipe } = await import("../db/recipes");
      const ok = await deleteRecipe(db, id);
      if (!ok) throw new Error("Recept niet gevonden");
    },
  };
}

export function validateRecipeInput(input: unknown): input is RecipeInput {
  return (
    validateRecipe({ ...(input as Record<string, unknown>), id: "temp" }) !==
    null
  );
}

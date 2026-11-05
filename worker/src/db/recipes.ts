import type { Recipe } from "@shared/recipe";
import { validateRecipe } from "@shared/recipe";

export interface RecipeRow {
  id: string;
  title: string;
  category: string;
  prep_minutes: number;
  cook_minutes: number;
  servings: number;
  difficulty: string;
  summary: string;
  ingredients_json: string;
  steps_json: string;
  tags_json: string;
}

export function recipeFromRow(row: RecipeRow): Recipe | null {
  try {
    return validateRecipe({
      id: row.id,
      title: row.title,
      category: row.category,
      prepMinutes: row.prep_minutes,
      cookMinutes: row.cook_minutes,
      servings: row.servings,
      difficulty: row.difficulty,
      summary: row.summary,
      ingredients: JSON.parse(row.ingredients_json) as unknown,
      steps: JSON.parse(row.steps_json) as unknown,
      tags: JSON.parse(row.tags_json) as unknown,
    });
  } catch {
    return null;
  }
}

export function recipeToRow(recipe: Recipe): RecipeRow {
  return {
    id: recipe.id,
    title: recipe.title,
    category: recipe.category,
    prep_minutes: recipe.prepMinutes,
    cook_minutes: recipe.cookMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    summary: recipe.summary,
    ingredients_json: JSON.stringify(recipe.ingredients),
    steps_json: JSON.stringify(recipe.steps),
    tags_json: JSON.stringify(recipe.tags),
  };
}

export async function listRecipes(db: D1Database): Promise<Recipe[]> {
  const result = await db
    .prepare(
      "SELECT id, title, category, prep_minutes, cook_minutes, servings, difficulty, summary, ingredients_json, steps_json, tags_json FROM recipes ORDER BY created_at DESC",
    )
    .all<RecipeRow>();
  return result.results
    .map(recipeFromRow)
    .filter((r): r is Recipe => r !== null);
}

export async function getRecipe(
  db: D1Database,
  id: string,
): Promise<Recipe | null> {
  const row = await db
    .prepare(
      "SELECT id, title, category, prep_minutes, cook_minutes, servings, difficulty, summary, ingredients_json, steps_json, tags_json FROM recipes WHERE id = ?",
    )
    .bind(id)
    .first<RecipeRow>();
  return row ? recipeFromRow(row) : null;
}

export async function createRecipe(
  db: D1Database,
  recipe: Recipe,
): Promise<void> {
  const row = recipeToRow(recipe);
  await db
    .prepare(
      `INSERT INTO recipes (id, title, category, prep_minutes, cook_minutes, servings, difficulty, summary, ingredients_json, steps_json, tags_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.id,
      row.title,
      row.category,
      row.prep_minutes,
      row.cook_minutes,
      row.servings,
      row.difficulty,
      row.summary,
      row.ingredients_json,
      row.steps_json,
      row.tags_json,
    )
    .run();
}

export async function updateRecipe(
  db: D1Database,
  id: string,
  recipe: Recipe,
): Promise<boolean> {
  const row = recipeToRow(recipe);
  const result = await db
    .prepare(
      `UPDATE recipes SET title = ?, category = ?, prep_minutes = ?, cook_minutes = ?,
      servings = ?, difficulty = ?, summary = ?, ingredients_json = ?, steps_json = ?, tags_json = ?
     WHERE id = ?`,
    )
    .bind(
      row.title,
      row.category,
      row.prep_minutes,
      row.cook_minutes,
      row.servings,
      row.difficulty,
      row.summary,
      row.ingredients_json,
      row.steps_json,
      row.tags_json,
      id,
    )
    .run();
  return result.meta.changes > 0;
}

export async function deleteRecipe(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM recipes WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}

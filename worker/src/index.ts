import type { Recipe } from "../../shared/recipe";
import {
  recipeCategories,
  recipeDifficulties,
  validateRecipe,
} from "../../shared/recipe";

interface Env {
  DB: D1Database;
}

interface RecipeRow {
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

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function recipeFromRow(row: RecipeRow): Recipe | null {
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

function isValidRecipeInput(input: unknown): input is Recipe {
  const recipe = validateRecipe(input);
  return recipe !== null;
}

async function listRecipes(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    "SELECT id, title, category, prep_minutes, cook_minutes, servings, difficulty, summary, ingredients_json, steps_json, tags_json FROM recipes ORDER BY created_at DESC",
  ).all<RecipeRow>();
  const recipes = result.results
    .map(recipeFromRow)
    .filter((recipe): recipe is Recipe => recipe !== null);
  return json(recipes);
}

async function getRecipe(id: string, env: Env): Promise<Response> {
  const row = await env.DB.prepare(
    "SELECT id, title, category, prep_minutes, cook_minutes, servings, difficulty, summary, ingredients_json, steps_json, tags_json FROM recipes WHERE id = ?",
  )
    .bind(id)
    .first<RecipeRow>();
  const recipe = row ? recipeFromRow(row) : null;
  return recipe ? json(recipe) : json({ error: "Recipe not found." }, 404);
}

async function createRecipe(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const input =
    body && typeof body === "object"
      ? { ...(body as Record<string, unknown>), id: crypto.randomUUID() }
      : null;
  if (!isValidRecipeInput(input)) {
    return json(
      {
        error: `Recipe must include a title, valid category (${recipeCategories.join(", ")}), difficulty (${recipeDifficulties.join(", ")}), timings, servings, ingredients, and steps.`,
      },
      400,
    );
  }

  await env.DB.prepare(
    `INSERT INTO recipes
      (id, title, category, prep_minutes, cook_minutes, servings, difficulty, summary, ingredients_json, steps_json, tags_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      input.id,
      input.title,
      input.category,
      input.prepMinutes,
      input.cookMinutes,
      input.servings,
      input.difficulty,
      input.summary,
      JSON.stringify(input.ingredients),
      JSON.stringify(input.steps),
      JSON.stringify(input.tags),
    )
    .run();

  return json(input, 201);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");

    try {
      if (path === "/api/recipes" && request.method === "GET") {
        return await listRecipes(env);
      }
      if (path === "/api/recipes" && request.method === "POST") {
        return await createRecipe(request, env);
      }
      if (path.startsWith("/api/recipes/") && request.method === "GET") {
        return await getRecipe(
          decodeURIComponent(path.slice("/api/recipes/".length)),
          env,
        );
      }
      return json({ error: "Not found." }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: "The recipe service is unavailable." }, 500);
    }
  },
};

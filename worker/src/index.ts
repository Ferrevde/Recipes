import type { Recipe } from "../../shared/recipe";
import { importRecipeFromImage, importRecipeFromUrl } from "./recipeImport";
import {
  recipeCategories,
  recipeDifficulties,
  validateRecipe,
} from "../../shared/recipe";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  GEMINI_API_KEY?: string;
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
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

async function importRecipe(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "De aanvraag moet geldige JSON bevatten." }, 400);
  }
  const sourceUrl =
    body && typeof body === "object" && "url" in body
      ? String((body as { url?: unknown }).url ?? "")
      : "";
  try {
    return json(
      await importRecipeFromUrl(sourceUrl, env.GEMINI_API_KEY?.trim()),
    );
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Importeren mislukt." },
      422,
    );
  }
}

async function importRecipeImage(
  request: Request,
  env: Env,
): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Het afbeeldingsformulier is ongeldig." }, 400);
  }
  const value = form.get("image");
  if (!(value instanceof File)) {
    return json({ error: "Kies eerst een afbeelding." }, 400);
  }
  try {
    return json(await importRecipeFromImage(value, env.GEMINI_API_KEY?.trim()));
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Importeren mislukt." },
      422,
    );
  }
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
  return recipe ? json(recipe) : json({ error: "Recept niet gevonden." }, 404);
}

async function updateRecipe(
  id: string,
  request: Request,
  env: Env,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "De aanvraag moet geldige JSON bevatten." }, 400);
  }

  const input =
    body && typeof body === "object"
      ? { ...(body as Record<string, unknown>), id }
      : null;
  if (!isValidRecipeInput(input)) {
    return json({ error: "De receptgegevens zijn ongeldig." }, 400);
  }

  const result = await env.DB.prepare(
    `UPDATE recipes SET title = ?, category = ?, prep_minutes = ?, cook_minutes = ?,
      servings = ?, difficulty = ?, summary = ?, ingredients_json = ?, steps_json = ?, tags_json = ?
     WHERE id = ?`,
  )
    .bind(
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
      id,
    )
    .run();

  return result.meta.changes > 0
    ? json(input)
    : json({ error: "Recept niet gevonden." }, 404);
}

async function deleteRecipe(id: string, env: Env): Promise<Response> {
  const result = await env.DB.prepare("DELETE FROM recipes WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0
    ? new Response(null, { status: 204, headers: corsHeaders })
    : json({ error: "Recept niet gevonden." }, 404);
}

async function createRecipe(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "De aanvraag moet geldige JSON bevatten." }, 400);
  }

  const input =
    body && typeof body === "object"
      ? { ...(body as Record<string, unknown>), id: crypto.randomUUID() }
      : null;
  if (!isValidRecipeInput(input)) {
    return json(
      {
        error: `Een recept moet een naam en geldige categorie (${recipeCategories.join(", ")}), moeilijkheid (${recipeDifficulties.join(", ")}), tijden, porties, ingredi�nten en stappen bevatten.`,
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
      if (path === "/api/import" && request.method === "POST") {
        return await importRecipe(request, env);
      }
      if (path === "/api/import-image" && request.method === "POST") {
        return await importRecipeImage(request, env);
      }
      if (path === "/api/recipes" && request.method === "GET") {
        return await listRecipes(env);
      }
      if (path === "/api/recipes" && request.method === "POST") {
        return await createRecipe(request, env);
      }
      if (path.startsWith("/api/recipes/")) {
        const id = decodeURIComponent(path.slice("/api/recipes/".length));
        if (request.method === "GET") {
          return await getRecipe(id, env);
        }
        if (request.method === "PUT") {
          return await updateRecipe(id, request, env);
        }
        if (request.method === "DELETE") {
          return await deleteRecipe(id, env);
        }
      }
      if (request.method === "GET" || request.method === "HEAD") {
        return env.ASSETS.fetch(request);
      }
      return json({ error: "Niet gevonden." }, 404);
    } catch (error) {
      console.error(error);
      return json(
        { error: "De receptenservice is tijdelijk niet beschikbaar." },
        500,
      );
    }
  },
};

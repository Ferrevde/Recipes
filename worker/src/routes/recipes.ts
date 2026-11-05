import type { RecipeInput } from "@shared/recipe";
import { validateRecipe } from "@shared/recipe";
import { json, jsonError, requireAdmin } from "../utils/http";
import { createRecipeService } from "../services/recipes";

export interface Env {
  DB: D1Database;
}

export async function handleRecipesRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;

  const service = createRecipeService(env.DB);

  // GET /api/recipes
  if (path === "/api/recipes" && method === "GET") {
    const recipes = await service.list();
    return json(recipes);
  }

  // POST /api/admin/recipes (create)
  if (
    (path === "/api/recipes" || path === "/api/admin/recipes") &&
    method === "POST"
  ) {
    const denied = requireAdmin(request);
    if (denied) return denied;
    return createRecipe(request, service);
  }

  // Single recipe routes
  if (
    path.startsWith("/api/recipes/") ||
    path.startsWith("/api/admin/recipes/")
  ) {
    const id = decodeURIComponent(
      path.replace(/^\/api\/(admin\/)?recipes\//, ""),
    );

    // GET /api/recipes/:id
    if (method === "GET") {
      const recipe = await service.get(id);
      return recipe ? json(recipe) : jsonError("Recept niet gevonden.", 404);
    }

    // PUT /api/admin/recipes/:id or PUT/DELETE /api/recipes/:id
    if (method === "PUT" || method === "DELETE") {
      const denied = requireAdmin(request);
      if (denied) return denied;
      if (method === "PUT") {
        return updateRecipe(id, request, service);
      }
      return deleteRecipe(id, service);
    }
  }

  return jsonError("Niet gevonden.", 404);
}

async function createRecipe(
  request: Request,
  service: ReturnType<typeof createRecipeService>,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("De aanvraag moet geldige JSON bevatten.", 400);
  }

  const input =
    body && typeof body === "object"
      ? { ...(body as Record<string, unknown>), id: crypto.randomUUID() }
      : null;

  if (!validateRecipeInput(input)) {
    return jsonError("De receptgegevens zijn ongeldig.", 400);
  }

  try {
    const recipe = await service.create(input);
    return json(recipe, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Aanmaken mislukt.", 400);
  }
}

async function updateRecipe(
  id: string,
  request: Request,
  service: ReturnType<typeof import("../services/recipes").createRecipeService>,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("De aanvraag moet geldige JSON bevatten.", 400);
  }

  const input =
    body && typeof body === "object"
      ? { ...(body as Record<string, unknown>), id }
      : null;

  if (!validateRecipeInput(input)) {
    return jsonError("De receptgegevens zijn ongeldig.", 400);
  }

  try {
    const recipe = await service.update(id, input);
    return json(recipe);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Bijwerken mislukt.",
      404,
    );
  }
}

async function deleteRecipe(
  id: string,
  service: ReturnType<typeof import("../services/recipes").createRecipeService>,
): Promise<Response> {
  try {
    await service.delete(id);
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Verwijderen mislukt.",
      404,
    );
  }
}

function validateRecipeInput(input: unknown): input is RecipeInput {
  return (
    validateRecipe({ ...(input as Record<string, unknown>), id: "temp" }) !==
    null
  );
}

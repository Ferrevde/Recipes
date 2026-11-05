import { json, jsonError, requireAdmin } from "../utils/http";
import { createGeminiService } from "../services/gemini";
import type { Recipe, RecipeInput } from "@shared/recipe";
import { validateRecipe } from "@shared/recipe";

export interface Env {
  DB: D1Database;
  GEMINI_API_KEY?: string;
}

export async function handleAdminRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;

  // All admin routes require Cloudflare Access
  const denied = requireAdmin(request);
  if (denied) return denied;

  const geminiService = createGeminiService();

  // POST /api/admin/import (URL)
  if (path === "/api/admin/import" && method === "POST") {
    return importFromUrl(request, geminiService, env.GEMINI_API_KEY?.trim());
  }

  // POST /api/admin/import-image (screenshot)
  if (path === "/api/admin/import-image" && method === "POST") {
    return importFromImage(request, geminiService, env.GEMINI_API_KEY?.trim());
  }

  // POST /api/admin/import-pdfs (bulk PDF)
  if (path === "/api/admin/import-pdfs" && method === "POST") {
    return importFromPdfs(request, geminiService, env.GEMINI_API_KEY?.trim());
  }

  // Recipe CRUD under /api/admin/recipes
  if (path === "/api/admin/recipes" && method === "POST") {
    return createAdminRecipe(request, env.DB);
  }
  if (path.startsWith("/api/admin/recipes/")) {
    const id = decodeURIComponent(path.slice("/api/admin/recipes/".length));
    if (method === "PUT") {
      return updateAdminRecipe(id, request, env.DB);
    }
    if (method === "DELETE") {
      return deleteAdminRecipe(id, env.DB);
    }
  }

  return jsonError("Niet gevonden.", 404);
}

async function importFromUrl(
  request: Request,
  gemini: ReturnType<typeof import("../services/gemini").createGeminiService>,
  apiKey: string | undefined,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("De aanvraag moet geldige JSON bevatten.", 400);
  }
  const sourceUrl =
    body && typeof body === "object" && "url" in body
      ? String((body as { url?: unknown }).url ?? "")
      : "";
  try {
    const input = await gemini.importFromUrl(sourceUrl, apiKey ?? "");
    return json(input);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Importeren mislukt.",
      422,
    );
  }
}

async function importFromImage(
  request: Request,
  gemini: ReturnType<typeof import("../services/gemini").createGeminiService>,
  apiKey: string | undefined,
): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Het afbeeldingsformulier is ongeldig.", 400);
  }
  const value = form.get("image");
  if (!(value instanceof File)) {
    return jsonError("Kies eerst een afbeelding.", 400);
  }
  try {
    const input = await gemini.importFromImage(value, apiKey ?? "");
    return json(input);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Importeren mislukt.",
      422,
    );
  }
}

async function importFromPdfs(
  request: Request,
  gemini: ReturnType<typeof import("../services/gemini").createGeminiService>,
  apiKey: string | undefined,
): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Het PDF-formulier is ongeldig.", 400);
  }
  const files = form
    .getAll("files")
    .filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return jsonError("Kies minstens één PDF-bestand.", 400);
  }
  if (files.length > 20) {
    return jsonError(
      "Je kunt maximaal 20 PDF-bestanden tegelijk importeren.",
      400,
    );
  }
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > 80 * 1024 * 1024) {
    return jsonError("De totale upload mag maximaal 80 MB groot zijn.", 400);
  }

  const results: Array<{
    filename: string;
    recipe?: Omit<Recipe, "id">;
    error?: string;
  }> = [];
  for (const file of files) {
    try {
      const input = await gemini.importFromPdf(file, apiKey ?? "");
      results.push({ filename: file.name, recipe: input });
    } catch (e) {
      results.push({
        filename: file.name,
        error: e instanceof Error ? e.message : "PDF importeren mislukt.",
      });
    }
  }
  return json({ results });
}

async function createAdminRecipe(
  request: Request,
  db: D1Database,
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

  const validatedInput = validateRecipeInput(input);
  if (!validatedInput) {
    return jsonError("De receptgegevens zijn ongeldig.", 400);
  }

  try {
    const { createRecipeService } = await import("../services/recipes");
    const service = createRecipeService(db);
    const recipe = await service.create(validatedInput);
    return json(recipe, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Aanmaken mislukt.", 400);
  }
}

async function updateAdminRecipe(
  id: string,
  request: Request,
  db: D1Database,
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

  const validatedInput = validateRecipeInput(input);
  if (!validatedInput) {
    return jsonError("De receptgegevens zijn ongeldig.", 400);
  }

  try {
    const { createRecipeService } = await import("../services/recipes");
    const service = createRecipeService(db);
    const recipe = await service.update(id, validatedInput);
    return json(recipe);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Bijwerken mislukt.",
      404,
    );
  }
}

async function deleteAdminRecipe(
  id: string,
  db: D1Database,
): Promise<Response> {
  try {
    const { createRecipeService } = await import("../services/recipes");
    const service = createRecipeService(db);
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

function validateRecipeInput(input: unknown): RecipeInput | null {
  return validateRecipe({ ...(input as Record<string, unknown>), id: "temp" });
}

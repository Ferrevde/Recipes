import type { Recipe } from "../../../shared/recipe";
import { validateRecipe } from "../../../shared/recipe";
import { recipeCatalog } from "./recipeCatalog";

const STORAGE_KEY = "recipes.customRecipes";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
] as const;
const GEMINI_TIMEOUT_MS = 30_000;

export type RecipeInput = Omit<Recipe, "id">;

class GeminiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

function readStoredRecipes(): Recipe[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value
          .map(validateRecipe)
          .filter((recipe): recipe is Recipe => recipe !== null)
      : [];
  } catch {
    return [];
  }
}

function writeStoredRecipes(recipes: Recipe[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function mergeRecipes(customRecipes: Recipe[]): Recipe[] {
  const byId = new Map(recipeCatalog.map((recipe) => [recipe.id, recipe]));
  for (const recipe of customRecipes) byId.set(recipe.id, recipe);
  return [...byId.values()];
}

function requireGeminiKey(): string {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini is niet ingesteld. Voeg VITE_GEMINI_API_KEY toe aan de omgeving.",
    );
  }
  return GEMINI_API_KEY;
}

export const recipesApi = {
  async list(): Promise<Recipe[]> {
    return mergeRecipes(readStoredRecipes());
  },

  async byId(id: string): Promise<Recipe | null> {
    return (
      mergeRecipes(readStoredRecipes()).find((recipe) => recipe.id === id) ??
      null
    );
  },

  async storedById(id: string): Promise<Recipe | null> {
    return readStoredRecipes().find((recipe) => recipe.id === id) ?? null;
  },

  async importFromImage(image: File): Promise<RecipeInput> {
    const key = requireGeminiKey();
    if (!image.type.startsWith("image/")) {
      throw new Error("Upload een geldige afbeelding.");
    }
    if (image.size > 8 * 1024 * 1024) {
      throw new Error("De afbeelding mag maximaal 8 MB groot zijn.");
    }

    const imageData = await toBase64(image);
    let lastError: unknown = null;
    for (const model of GEMINI_MODEL_FALLBACKS) {
      try {
        const body = await requestGeminiModel(key, model, image, imageData);
        const parsed = parseGeminiJson(readGeminiText(body));
        const recipe = validateRecipe({
          id: "image-preview",
          ...(parsed as object),
        });
        if (!recipe) {
          throw new GeminiError("De screenshot gaf geen geldig recept terug.");
        }
        const { id: _id, ...input } = recipe;
        return input;
      } catch (error) {
        const normalizedError =
          error instanceof GeminiError
            ? error
            : new GeminiError(
                error instanceof Error
                  ? error.message
                  : "Gemini gaf een ongeldig antwoord.",
              );
        lastError = normalizedError;
        if (!shouldTryFallback(normalizedError)) throw normalizedError;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Gemini kon de screenshot niet verwerken.");
  },

  async create(input: RecipeInput): Promise<Recipe> {
    const recipe = validateRecipe({ id: crypto.randomUUID(), ...input });
    if (!recipe) throw new Error("De receptgegevens zijn ongeldig.");
    writeStoredRecipes([...readStoredRecipes(), recipe]);
    return recipe;
  },

  async update(id: string, input: RecipeInput): Promise<Recipe> {
    const recipe = validateRecipe({ id, ...input });
    if (!recipe) throw new Error("De receptgegevens zijn ongeldig.");
    const recipes = readStoredRecipes();
    if (!recipes.some((item) => item.id === id)) {
      throw new Error("Dit recept is niet lokaal opgeslagen.");
    }
    writeStoredRecipes(recipes.map((item) => (item.id === id ? recipe : item)));
    return recipe;
  },

  async remove(id: string): Promise<void> {
    const recipes = readStoredRecipes();
    if (!recipes.some((item) => item.id === id)) {
      throw new Error("Dit recept is niet lokaal opgeslagen.");
    }
    writeStoredRecipes(recipes.filter((item) => item.id !== id));
  },
};

async function requestGeminiModel(
  apiKey: string,
  model: string,
  image: File,
  imageData: string,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    GEMINI_TIMEOUT_MS,
  );
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "Je bent een nauwkeurige Nederlandse receptenparser. Geef uitsluitend geldige JSON terug met exact deze velden: title, summary, ingredients (array met amount, unit, title), steps (array strings), tags (array strings), category (breakfast, lunch, dinner, dessert of snack), prepMinutes (getal), cookMinutes (getal), servings (getal), difficulty (Easy, Medium of Advanced). Vertaal alles naar natuurlijk Nederlands. Behoud hoeveelheden exact. Als informatie ontbreekt, gebruik een lege tekst of 0. Verzin geen ingrediënten of stappen.",
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Lees het recept uit deze afbeelding (${image.name}) en zet het om naar het gevraagde JSON-formaat.`,
                },
                {
                  inline_data: {
                    data: imageData,
                    mime_type: image.type,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        method: "POST",
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      const rawError = await response.text();
      throw new GeminiError(
        `Gemini wees model ${model} af (${response.status}): ${readGeminiError(rawError)}`,
        response.status,
      );
    }
    return response.json();
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GeminiError(
        `Gemini reageerde niet op tijd met model ${model}.`,
      );
    }
    throw new GeminiError(
      `Gemini is tijdelijk niet bereikbaar met model ${model}.`,
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

function shouldTryFallback(error: unknown): boolean {
  return (
    error instanceof GeminiError &&
    (error.status === null ||
      error.status === 404 ||
      error.status === 408 ||
      error.status === 429 ||
      error.status >= 500)
  );
}

function parseGeminiJson(text: string): unknown {
  const candidate =
    text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim() ?? text.trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new GeminiError("Gemini gaf geen geldige JSON terug.");
    }
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      throw new GeminiError("Gemini gaf geen geldige JSON terug.");
    }
  }
}

function readGeminiText(body: unknown): string {
  if (!body || typeof body !== "object") {
    throw new Error("Gemini gaf een ongeldig antwoord.");
  }
  const candidates = (body as { candidates?: unknown }).candidates;
  if (
    !Array.isArray(candidates) ||
    !candidates[0] ||
    typeof candidates[0] !== "object"
  ) {
    throw new Error("Gemini gaf geen recept terug.");
  }
  const content = (candidates[0] as { content?: unknown }).content;
  const parts =
    content && typeof content === "object"
      ? (content as { parts?: unknown }).parts
      : null;
  if (!Array.isArray(parts))
    throw new Error("Gemini gaf geen recepttekst terug.");
  const text = parts.find(
    (part): part is { text: string } =>
      part !== null &&
      typeof part === "object" &&
      typeof (part as { text?: unknown }).text === "string",
  );
  if (!text) throw new Error("Gemini gaf geen leesbaar recept terug.");
  return text.text;
}

function readGeminiError(rawError: string): string {
  try {
    const parsed = JSON.parse(rawError) as { error?: { message?: unknown } };
    if (typeof parsed.error?.message === "string") return parsed.error.message;
  } catch {
    // Gebruik een begrensde tekst als Gemini geen JSON-fout terugstuurt.
  }
  return rawError.slice(0, 240) || "onbekende fout";
}

async function toBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

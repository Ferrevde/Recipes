import type { Recipe } from "../../../shared/recipe";
import { validateRecipe } from "../../../shared/recipe";
import { recipeCatalog } from "./recipeCatalog";

const STORAGE_KEY = "recipes.customRecipes";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
export type RecipeInput = Omit<Recipe, "id">;

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Lees deze receptenafbeelding. Geef uitsluitend geldige JSON terug met exact deze velden: title, summary, ingredients (array met amount, unit, title), steps (array strings), tags (array strings), category (breakfast, lunch, dinner, dessert of snack), prepMinutes (getal), cookMinutes (getal), servings (getal), difficulty (Easy, Medium of Advanced). Vertaal alles naar natuurlijk Nederlands. Behoud hoeveelheden exact. Als informatie ontbreekt, gebruik een lege tekst of 0.",
                },
                {
                  inline_data: {
                    data: await toBase64(image),
                    mime_type: image.type,
                  },
                },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
    const body: unknown = await response.json();
    if (!response.ok) {
      throw new Error(readGeminiError(body));
    }
    const text = readGeminiText(body);
    const parsed: unknown = JSON.parse(text);
    const recipe = validateRecipe({
      id: "image-preview",
      ...(parsed as object),
    });
    if (!recipe) {
      throw new Error("De screenshot gaf geen geldig recept terug.");
    }
    const { id: _id, ...input } = recipe;
    return input;
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

async function toBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function readGeminiText(body: unknown): string {
  if (!body || typeof body !== "object")
    throw new Error("Gemini gaf een ongeldig antwoord.");
  const candidate = (body as { candidates?: unknown }).candidates;
  if (
    !Array.isArray(candidate) ||
    !candidate[0] ||
    typeof candidate[0] !== "object"
  ) {
    throw new Error("Gemini gaf geen recept terug.");
  }
  const content = (candidate[0] as { content?: unknown }).content;
  const parts =
    content && typeof content === "object"
      ? (content as { parts?: unknown }).parts
      : null;
  if (!Array.isArray(parts))
    throw new Error("Gemini gaf geen recepttekst terug.");
  const text = parts.find(
    (part): part is { text: string } =>
      part &&
      typeof part === "object" &&
      typeof (part as { text?: unknown }).text === "string",
  );
  if (!text) throw new Error("Gemini gaf geen leesbaar recept terug.");
  return text.text;
}

function readGeminiError(body: unknown): string {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: { message?: unknown } }).error;
    if (error && typeof error.message === "string")
      return `Gemini: ${error.message}`;
  }
  return "Gemini kon de screenshot niet verwerken.";
}

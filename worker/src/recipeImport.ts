import type { Recipe } from "../../shared/recipe";
import { validateRecipe } from "../../shared/recipe";

type RecipeInput = Omit<Recipe, "id">;

const GEMINI_MODEL_FALLBACKS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;
const GEMINI_TIMEOUT_MS = 30_000;

class GeminiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

export async function importRecipeFromImage(
  image: File,
  apiKey: string | undefined,
): Promise<RecipeInput> {
  if (!image.type.startsWith("image/")) {
    throw new Error("Upload een geldige afbeelding.");
  }
  if (image.size > 8 * 1024 * 1024) {
    throw new Error("De afbeelding mag maximaal 8 MB groot zijn.");
  }
  if (!apiKey) {
    throw new Error("Gemini is niet ingesteld op de receptenservice.");
  }

  const imageData = toBase64(await image.arrayBuffer());
  let lastError: unknown = null;
  for (const model of GEMINI_MODEL_FALLBACKS) {
    try {
      const body = await requestGeminiModel(apiKey, model, image, imageData);
      const parsed = parseGeminiJson(readGeminiText(body));
      const recipe = validateRecipe({
        id: "image-preview",
        ...(parsed as Record<string, unknown>),
      });
      if (!recipe) {
        throw new GeminiError("De screenshot gaf geen geldig recept terug.");
      }
      const { id: _id, ...input } = recipe;
      return input;
    } catch (error) {
      const normalized =
        error instanceof GeminiError
          ? error
          : new GeminiError(
              error instanceof Error
                ? error.message
                : "Gemini gaf een ongeldig antwoord.",
            );
      lastError = normalized;
      if (!shouldTryFallback(normalized)) throw normalized;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini kon de screenshot niet verwerken.");
}

async function requestGeminiModel(
  apiKey: string,
  model: string,
  image: File,
  imageData: string,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
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
          generationConfig: { responseMimeType: "application/json" },
        }),
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      throw new GeminiError(
        `Gemini wees model ${model} af (${response.status}): ${readError(detail)}`,
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
    clearTimeout(timeout);
  }
}

function shouldTryFallback(error: GeminiError): boolean {
  return (
    error.status === null ||
    error.status === 404 ||
    error.status === 408 ||
    error.status === 429 ||
    error.status >= 500
  );
}

function readGeminiText(body: unknown): string {
  if (!body || typeof body !== "object") {
    throw new GeminiError("Gemini gaf een ongeldig antwoord.");
  }
  const candidates = (body as { candidates?: unknown }).candidates;
  if (
    !Array.isArray(candidates) ||
    !candidates[0] ||
    typeof candidates[0] !== "object"
  ) {
    throw new GeminiError("Gemini gaf geen recept terug.");
  }
  const content = (candidates[0] as { content?: unknown }).content;
  const parts =
    content && typeof content === "object"
      ? (content as { parts?: unknown }).parts
      : null;
  if (!Array.isArray(parts))
    throw new GeminiError("Gemini gaf geen recepttekst terug.");
  const text = parts.find(
    (part): part is { text: string } =>
      part !== null &&
      typeof part === "object" &&
      typeof (part as { text?: unknown }).text === "string",
  );
  if (!text) throw new GeminiError("Gemini gaf geen leesbaar recept terug.");
  return text.text;
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

function readError(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: unknown } };
    if (typeof parsed.error?.message === "string") return parsed.error.message;
  } catch {
    // Gebruik een begrensde tekst bij een niet-JSON foutantwoord.
  }
  return raw.slice(0, 240) || "onbekende fout";
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

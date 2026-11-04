import type { Recipe, RecipeCategory } from "../../shared/recipe";
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

interface JsonLdRecipe {
  "@type"?: unknown;
  name?: unknown;
  description?: unknown;
  recipeCategory?: unknown;
  prepTime?: unknown;
  cookTime?: unknown;
  totalTime?: unknown;
  recipeYield?: unknown;
  recipeIngredient?: unknown;
  recipeInstructions?: unknown;
  keywords?: unknown;
}

export async function importRecipeFromUrl(
  sourceUrl: string,
  apiKey: string | undefined,
): Promise<RecipeInput> {
  const url = parseUrl(sourceUrl);
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Receptenboek/1.0 openbare receptimport",
    },
  });
  const html = await response.text();
  if (
    /token\.roularta\.be|sso\.roularta\.be/i.test(response.url) ||
    /<title>\s*inloggen\s*<\/title>/i.test(html)
  ) {
    throw new Error(
      "Deze website vereist een persoonlijke login. Openbare receptenpagina's kunnen wel worden geïmporteerd.",
    );
  }
  if (!response.ok)
    throw new Error(`De website gaf status ${response.status}.`);
  const source = findRecipe(html);
  if (!source) {
    throw new Error(
      "Op deze website werd geen gestructureerd recept gevonden. Probeer een andere receptenpagina.",
    );
  }
  const draft = toRecipeInput(source);
  const translated = await translateRecipe(draft, apiKey);
  const valid = validateRecipe({ id: "import-preview", ...translated });
  if (!valid) throw new Error("Het recept kon niet volledig worden gelezen.");
  const { id: _id, ...input } = valid;
  return input;
}

export async function importRecipeFromPdf(
  pdf: File,
  apiKey: string | undefined,
): Promise<RecipeInput> {
  if (pdf.type !== "application/pdf") {
    throw new Error("Upload een geldig PDF-bestand.");
  }
  if (pdf.size > 12 * 1024 * 1024) {
    throw new Error("Een PDF mag maximaal 12 MB groot zijn.");
  }
  if (!apiKey) {
    throw new Error("Gemini is niet ingesteld op de receptenservice.");
  }

  const pdfData = toBase64(await pdf.arrayBuffer());
  let lastError: unknown = null;
  for (const model of GEMINI_MODEL_FALLBACKS) {
    try {
      const body = await requestGeminiModel(
        apiKey,
        model,
        pdf,
        `Lees alle informatie uit dit recept-PDF-bestand (${pdf.name}) en zet het om naar het gevraagde JSON-formaat. Verwerk precies één recept uit dit bestand.`,
        pdfData,
      );
      const parsed = parseGeminiJson(readGeminiText(body));
      const recipe = validateRecipe({
        id: "pdf-preview",
        ...(parsed as Record<string, unknown>),
      });
      if (!recipe) {
        throw new GeminiError("Het PDF-bestand gaf geen geldig recept terug.");
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
    : new Error("Gemini kon het PDF-bestand niet verwerken.");
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
      const body = await requestGeminiModel(
        apiKey,
        model,
        image,
        `Lees het recept uit deze afbeelding (${image.name}) en zet het om naar het gevraagde JSON-formaat.`,
        imageData,
      );
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

function parseUrl(sourceUrl: string): URL {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    throw new Error("Vul een geldige website-URL in.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(
      "Alleen http- en https-websites kunnen worden geïmporteerd.",
    );
  }
  return url;
}

function findRecipe(html: string): JsonLdRecipe | null {
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const match of scripts) {
    try {
      const data: unknown = JSON.parse(match[1] ?? "");
      const recipe = findRecipeObject(data);
      if (recipe) return recipe;
    } catch {
      // Probeer het volgende JSON-LD-blok.
    }
  }
  return null;
}

function findRecipeObject(input: unknown): JsonLdRecipe | null {
  if (Array.isArray(input)) {
    for (const item of input) {
      const recipe = findRecipeObject(item);
      if (recipe) return recipe;
    }
    return null;
  }
  if (!input || typeof input !== "object") return null;
  const value = input as JsonLdRecipe & { "@graph"?: unknown };
  const type = value["@type"];
  if (
    (typeof type === "string" && type.toLowerCase() === "recipe") ||
    (Array.isArray(type) && type.some((item) => item === "Recipe"))
  ) {
    return value;
  }
  return findRecipeObject(value["@graph"]);
}

function toRecipeInput(source: JsonLdRecipe): RecipeInput {
  const ingredients = asStrings(source.recipeIngredient).map(parseIngredient);
  const prepMinutes = parseDuration(asText(source.prepTime));
  const cookMinutes = parseDuration(asText(source.cookTime));
  const totalMinutes = parseDuration(asText(source.totalTime));
  return {
    category: mapCategory(asText(source.recipeCategory)),
    cookMinutes: cookMinutes || Math.max(totalMinutes - prepMinutes, 0),
    difficulty: "Easy",
    ingredients,
    prepMinutes,
    servings: parseServings(source.recipeYield),
    steps: asInstructions(source.recipeInstructions),
    summary: asText(source.description),
    tags: asText(source.keywords)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    title: asText(source.name) || "Geïmporteerd recept",
  };
}

async function translateRecipe(
  input: RecipeInput,
  apiKey: string | undefined,
): Promise<RecipeInput> {
  if (!apiKey) return input;
  try {
    const body = await requestGeminiText(
      apiKey,
      `Vertaal dit recept volledig naar natuurlijk Nederlands. Behoud hoeveelheden en getallen exact. Geef uitsluitend geldige JSON terug met exact deze velden: title, summary, ingredients (array met amount, unit, title), steps (array strings), tags (array strings). Recept: ${JSON.stringify(input)}`,
    );
    const parsed = parseGeminiJson(readGeminiText(body));
    if (!parsed || typeof parsed !== "object") return input;
    const value = parsed as Record<string, unknown>;
    const ingredients = Array.isArray(value.ingredients)
      ? value.ingredients
          .map(asTranslatedIngredient)
          .filter(
            (item): item is Recipe["ingredients"][number] => item !== null,
          )
      : input.ingredients;
    const steps = Array.isArray(value.steps)
      ? value.steps.filter((step): step is string => typeof step === "string")
      : input.steps;
    return {
      ...input,
      ingredients: ingredients.length > 0 ? ingredients : input.ingredients,
      steps: steps.length > 0 ? steps : input.steps,
      summary: asText(value.summary) || input.summary,
      tags: Array.isArray(value.tags)
        ? value.tags.filter((tag): tag is string => typeof tag === "string")
        : input.tags,
      title: asText(value.title) || input.title,
    };
  } catch {
    return input;
  }
}

async function requestGeminiText(
  apiKey: string,
  prompt: string,
): Promise<unknown> {
  for (const model of GEMINI_MODEL_FALLBACKS) {
    try {
      return await requestGeminiModel(apiKey, model, null, prompt);
    } catch (error) {
      if (
        !shouldTryFallback(
          error instanceof GeminiError ? error : new GeminiError("Gemini-fout"),
        )
      )
        throw error;
    }
  }
  throw new GeminiError("Gemini kon het recept niet vertalen.");
}

function asTranslatedIngredient(
  input: unknown,
): Recipe["ingredients"][number] | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const title = asText(value.title);
  return title
    ? { amount: asText(value.amount), title, unit: asText(value.unit) }
    : null;
}

function asInstructions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((step) =>
      typeof step === "string"
        ? stripTags(step)
        : step && typeof step === "object" && "text" in step
          ? stripTags(asText((step as { text?: unknown }).text))
          : "",
    )
    .filter(Boolean);
}

function asStrings(input: unknown): string[] {
  return Array.isArray(input) ? input.map(asText).filter(Boolean) : [];
}

function asText(input: unknown): string {
  return typeof input === "string" || typeof input === "number"
    ? String(input).trim()
    : "";
}

function parseIngredient(value: string): Recipe["ingredients"][number] {
  const match = value.match(/^(\S+(?:\s+\S+)?)\s+(.+)$/);
  return match
    ? { amount: match[1] ?? "", title: match[2] ?? value, unit: "" }
    : { amount: "", title: value, unit: "" };
}

function parseDuration(value: string): number {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  return match ? Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0) : 0;
}

function parseServings(value: unknown): number {
  const match = asText(value).match(/\d+/);
  return match ? Math.max(1, Number(match[0])) : 1;
}

function mapCategory(value: string): RecipeCategory {
  const lower = value.toLowerCase();
  if (lower.includes("ontbijt") || lower.includes("breakfast"))
    return "breakfast";
  if (lower.includes("lunch")) return "lunch";
  if (lower.includes("dessert") || lower.includes("zoet")) return "dessert";
  if (lower.includes("snack") || lower.includes("tussendoor")) return "snack";
  return "dinner";
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function requestGeminiModel(
  apiKey: string,
  model: string,
  image: File | null,
  prompt: string,
  imageData?: string,
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
              parts:
                image && imageData
                  ? [
                      { text: prompt },
                      {
                        inline_data: {
                          data: imageData,
                          mime_type: image.type,
                        },
                      },
                    ]
                  : [{ text: prompt }],
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

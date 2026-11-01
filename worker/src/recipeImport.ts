import type { Recipe, RecipeCategory } from "../../shared/recipe";
import { recipeCategories, validateRecipe } from "../../shared/recipe";

type RecipeInput = Omit<Recipe, "id">;

interface JsonLdRecipe {
  "@type"?: unknown;
  name?: unknown;
  description?: unknown;
  recipeCategory?: unknown;
  recipeCuisine?: unknown;
  prepTime?: unknown;
  cookTime?: unknown;
  totalTime?: unknown;
  recipeYield?: unknown;
  recipeIngredient?: unknown;
  recipeInstructions?: unknown;
  keywords?: unknown;
}

interface AiResult {
  response?: unknown;
}

export async function importRecipeFromImage(
  image: File,
  ai: Ai,
): Promise<RecipeInput> {
  if (!image.type.startsWith("image/")) {
    throw new Error("Upload een geldige afbeelding.");
  }
  if (image.size > 8 * 1024 * 1024) {
    throw new Error("De afbeelding mag maximaal 8 MB groot zijn.");
  }

  const result: unknown = await ai.run("@cf/llava-hf/llava-1.5-7b-hf", {
    image: Array.from(new Uint8Array(await image.arrayBuffer())),
    max_tokens: 1024,
    prompt:
      "Lees deze Nederlandse receptenafbeelding. Geef uitsluitend geldige JSON terug met exact deze velden: title, summary, ingredients (array met amount, unit, title), steps (array strings), tags (array strings), category (breakfast, lunch, dinner, dessert of snack), prepMinutes (getal), cookMinutes (getal), servings (getal), difficulty (Easy, Medium of Advanced). Vertaal alle herkende tekst naar natuurlijk Nederlands. Behoud hoeveelheden exact. Als informatie ontbreekt, gebruik een lege tekst of 0.",
  });
  const text = aiText(result);
  const parsed = parseJson(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(
      "De afbeelding kon niet als recept worden gelezen. Gebruik een scherpere screenshot.",
    );
  }
  const recipe = validateRecipe({
    id: "image-preview",
    ...(parsed as Record<string, unknown>),
  });
  if (!recipe) {
    throw new Error(
      "Niet alle receptgegevens konden uit de afbeelding worden gehaald. Controleer de screenshot.",
    );
  }
  const { id: _id, ...input } = recipe;
  return input;
}

export async function importRecipeFromUrl(
  sourceUrl: string,
  ai: Ai,
): Promise<RecipeInput> {
  const url = parseUrl(sourceUrl);
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Receptenboek/1.0 recipe importer",
    },
  });
  if (!response.ok) {
    throw new Error(`De website gaf status ${response.status}.`);
  }

  const html = await response.text();
  if (
    /token\.roularta\.be|sso\.roularta\.be/i.test(response.url) ||
    /<title>\s*inloggen\s*<\/title>/i.test(html)
  ) {
    throw new Error(
      "Deze website vereist een persoonlijke login. Libelle Lekker stuurt de inhoud zonder jouw login door naar een inlogpagina. Openbare receptenpagina's kunnen wel worden geïmporteerd.",
    );
  }
  const source = findRecipe(html);
  if (!source) {
    throw new Error(
      "Op deze website werd geen gestructureerd recept gevonden. Probeer een andere receptenpagina.",
    );
  }

  const draft = toRecipeInput(source);
  const translated = await translateRecipe(draft, ai);
  const valid = validateRecipe({ id: "import-preview", ...translated });
  if (!valid) {
    throw new Error(
      "Het recept kon niet volledig worden gelezen. Controleer de bronpagina.",
    );
  }
  const { id: _id, ...input } = valid;
  return input;
}

function parseUrl(sourceUrl: string): URL {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    throw new Error("Vul een geldige website-URL in.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
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
      const data: unknown = JSON.parse(decodeEntities(match[1] ?? ""));
      const recipe = findRecipeObject(data);
      if (recipe) {
        return recipe;
      }
    } catch {
      // Ignore malformed JSON-LD blocks and inspect the next one.
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
  if (!input || typeof input !== "object") {
    return null;
  }
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
  const steps = asInstructions(source.recipeInstructions);
  const title = asText(source.name) || "Geïmporteerd recept";
  const category = mapCategory(asText(source.recipeCategory));
  const prepMinutes = parseDuration(asText(source.prepTime));
  const cookMinutes = parseDuration(asText(source.cookTime));
  const totalMinutes = parseDuration(asText(source.totalTime));
  const servings = parseServings(source.recipeYield);

  return {
    category,
    cookMinutes: cookMinutes || Math.max(totalMinutes - prepMinutes, 0),
    difficulty: "Easy",
    ingredients,
    prepMinutes,
    servings,
    steps,
    summary: asText(source.description),
    tags: asText(source.keywords)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    title,
  };
}

async function translateRecipe(
  input: RecipeInput,
  ai: Ai,
): Promise<RecipeInput> {
  const prompt = `Vertaal dit recept volledig naar natuurlijk Nederlands. Behoud hoeveelheden en getallen exact. Geef uitsluitend geldige JSON terug met exact deze velden: title, summary, ingredients (array met amount, unit, title), steps (array strings), tags (array strings). Vertaal alleen tekst, niet de hoeveelheden. Recept: ${JSON.stringify(input)}`;
  const result: unknown = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      {
        content: "Je bent een nauwkeurige Nederlandse kookredacteur.",
        role: "system",
      },
      { content: prompt, role: "user" },
    ],
  });
  const response = result as AiResult;
  if (typeof response.response !== "string") {
    return input;
  }
  const parsed = parseJson(response.response);
  if (!parsed || typeof parsed !== "object") {
    return input;
  }
  const value = parsed as Record<string, unknown>;
  const translatedIngredients = Array.isArray(value.ingredients)
    ? value.ingredients
        .map(asTranslatedIngredient)
        .filter(
          (ingredient): ingredient is Recipe["ingredients"][number] =>
            ingredient !== null,
        )
    : input.ingredients;
  const translatedSteps = Array.isArray(value.steps)
    ? value.steps.filter((step): step is string => typeof step === "string")
    : input.steps;
  const translatedTags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is string => typeof tag === "string")
    : input.tags;
  return {
    ...input,
    ingredients:
      translatedIngredients.length > 0
        ? translatedIngredients
        : input.ingredients,
    steps: translatedSteps.length > 0 ? translatedSteps : input.steps,
    summary: asText(value.summary) || input.summary,
    tags: translatedTags,
    title: asText(value.title) || input.title,
  };
}

function asTranslatedIngredient(
  input: unknown,
): Recipe["ingredients"][number] | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const title = asText(value.title);
  if (!title) return null;
  return { amount: asText(value.amount), title, unit: asText(value.unit) };
}

function asInstructions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((step) => {
      if (typeof step === "string") return stripTags(step);
      if (step && typeof step === "object" && "text" in step) {
        return stripTags(asText((step as { text?: unknown }).text));
      }
      return "";
    })
    .filter(Boolean);
}

function asStrings(input: unknown): string[] {
  return Array.isArray(input)
    ? input.filter((item): item is string => typeof item === "string")
    : [];
}

function asText(input: unknown): string {
  return typeof input === "string" || typeof input === "number"
    ? String(input).trim()
    : "";
}

function parseIngredient(input: string): Recipe["ingredients"][number] {
  const clean = stripTags(input);
  const match = clean.match(
    /^(\d+(?:[,.]\d+)?(?:\s*[-/]\s*\d+)?(?:\s+\w+)?)[\s:]+(.+)$/,
  );
  return match
    ? {
        amount: match[1]?.trim() ?? "",
        title: match[2]?.trim() ?? clean,
        unit: "",
      }
    : { amount: "", title: clean, unit: "" };
}

function parseDuration(value: string): number {
  const hours = Number(value.match(/(\d+)H/i)?.[1] ?? 0);
  const minutes = Number(value.match(/(\d+)M/i)?.[1] ?? 0);
  return hours * 60 + minutes;
}

function parseServings(input: unknown): number {
  const match = asText(input).match(/\d+/);
  return Math.max(Number(match?.[0] ?? 2), 1);
}

function mapCategory(value: string): RecipeCategory {
  const normalized = value.toLocaleLowerCase("nl");
  if (normalized.includes("ontbijt") || normalized.includes("breakfast"))
    return "breakfast";
  if (normalized.includes("lunch")) return "lunch";
  if (normalized.includes("dessert") || normalized.includes("sweet"))
    return "dessert";
  if (normalized.includes("snack") || normalized.includes("tussendoor"))
    return "snack";
  return recipeCategories.includes(normalized as RecipeCategory)
    ? (normalized as RecipeCategory)
    : "dinner";
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function aiText(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object") {
    const value = result as Record<string, unknown>;
    if (typeof value.description === "string") return value.description;
    if (typeof value.response === "string") return value.response;
  }
  return "";
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(
      value
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim(),
    );
  } catch {
    return null;
  }
}

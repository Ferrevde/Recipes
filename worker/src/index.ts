import type { Recipe } from "../../shared/recipe";
import {
  importRecipeFromImage,
  importRecipeFromPdf,
  importRecipeFromUrl,
} from "./recipeImport";
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

interface WeekMenuRow {
  menu_json: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  is_admin: number;
}

interface SessionUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

const SESSION_COOKIE = "recipes_session";
const SESSION_DAYS = 30;
const PASSWORD_ITERATIONS = 100_000;

const WEEKDAYS = new Set([
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag",
]);

let weekMenuTableReady: Promise<void> | null = null;

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Cache-Control": "no-store" },
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

async function importRecipePdfs(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Het PDF-formulier is ongeldig." }, 400);
  }
  const files = form
    .getAll("files")
    .filter((value): value is File => value instanceof File);
  if (files.length === 0) {
    return json({ error: "Kies minstens één PDF-bestand." }, 400);
  }
  if (files.length > 20) {
    return json(
      { error: "Je kunt maximaal 20 PDF-bestanden tegelijk importeren." },
      400,
    );
  }
  const totalSize = files.reduce((total, file) => total + file.size, 0);
  if (totalSize > 80 * 1024 * 1024) {
    return json(
      { error: "De totale upload mag maximaal 80 MB groot zijn." },
      400,
    );
  }

  const results: Array<{
    filename: string;
    recipe?: Omit<Recipe, "id">;
    error?: string;
  }> = [];
  for (const file of files) {
    try {
      results.push({
        filename: file.name,
        recipe: await importRecipeFromPdf(file, env.GEMINI_API_KEY?.trim()),
      });
    } catch (error) {
      results.push({
        error:
          error instanceof Error ? error.message : "PDF importeren mislukt.",
        filename: file.name,
      });
    }
  }
  return json({ results });
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

const textEncoder = new TextEncoder();

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(bytes: Uint8Array): string {
  return encodeBase64(bytes)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sha256(value: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", value));
}

async function hashPassword(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        hash: "SHA-256",
        iterations: PASSWORD_ITERATIONS,
        name: "PBKDF2",
        salt,
      },
      key,
      256,
    ),
  );
}

function normalizedEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const email = value.trim().toLocaleLowerCase("en-US");
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
    ? email
    : null;
}

function passwordValue(value: unknown): string | null {
  return typeof value === "string" && value.length >= 8 && value.length <= 200
    ? value
    : null;
}

function cookieValue(request: Request, name: string): string | null {
  const cookies = request.headers.get("Cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const [key, ...parts] = cookie.trim().split("=");
    if (key === name) {
      return parts.join("=") || null;
    }
  }
  return null;
}

function sessionCookie(token: string, maxAge: number): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function authJson(data: unknown, status: number, cookie?: string): Response {
  const headers = new Headers({ ...corsHeaders, "Cache-Control": "no-store" });
  if (cookie) {
    headers.set("Set-Cookie", cookie);
  }
  return new Response(JSON.stringify(data), { headers, status });
}

async function createSession(
  userId: string,
  env: Env,
): Promise<{ token: string; expiresAt: string }> {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = encodeBase64Url(tokenBytes);
  const tokenHash = encodeBase64(await sha256(textEncoder.encode(token)));
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  )
    .bind(tokenHash, userId, expiresAt)
    .run();
  return { token, expiresAt };
}

async function currentUser(
  request: Request,
  env: Env,
): Promise<SessionUser | null> {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) {
    return null;
  }
  const tokenHash = encodeBase64(await sha256(textEncoder.encode(token)));
  const row = await env.DB.prepare(
    `SELECT users.id, users.email, users.is_admin
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > CURRENT_TIMESTAMP`,
  )
    .bind(tokenHash)
    .first<{ id: string; email: string; is_admin: number }>();
  return row
    ? { email: row.email, id: row.id, isAdmin: row.is_admin === 1 }
    : null;
}

function accessAdmin(request: Request): boolean {
  return Boolean(
    request.headers.get("CF-Access-Authenticated-User-Email")?.trim(),
  );
}

function adminRequired(request: Request): Response | null {
  return accessAdmin(request)
    ? null
    : json({ error: "Cloudflare Access-adminrechten zijn vereist." }, 403);
}

let accountTablesReady: Promise<void> | null = null;

async function ensureAccountTables(env: Env): Promise<void> {
  if (!accountTablesReady) {
    accountTablesReady = (async () => {
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ).run();
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ).run();
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS user_favorites (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipe_id TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, recipe_id)
        )`,
      ).run();
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS user_week_menus (
          user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          menu_json TEXT NOT NULL DEFAULT '{}',
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ).run();
    })();
  }
  await accountTablesReady;
}

async function register(request: Request, env: Env): Promise<Response> {
  await ensureAccountTables(env);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "De aanvraag moet geldige JSON bevatten." }, 400);
  }
  const source =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email = normalizedEmail(source.email);
  const password = passwordValue(source.password);
  if (!email || !password) {
    return json(
      {
        error:
          "Gebruik een geldig e-mailadres en minstens 8 tekens als wachtwoord.",
      },
      400,
    );
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await hashPassword(password, salt);
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, password_salt) VALUES (?, ?, ?, ?)",
    )
      .bind(id, email, encodeBase64(passwordHash), encodeBase64(salt))
      .run();
  } catch {
    return json(
      { error: "Er bestaat al een account met dit e-mailadres." },
      409,
    );
  }
  const session = await createSession(id, env);
  return authJson(
    { user: { email, id, isAdmin: false } },
    201,
    sessionCookie(session.token, SESSION_DAYS * 24 * 60 * 60),
  );
}

async function login(request: Request, env: Env): Promise<Response> {
  await ensureAccountTables(env);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "De aanvraag moet geldige JSON bevatten." }, 400);
  }
  const source =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email = normalizedEmail(source.email);
  const password = passwordValue(source.password);
  if (!email || !password) {
    return json({ error: "Vul je e-mailadres en wachtwoord in." }, 400);
  }
  const row = await env.DB.prepare(
    "SELECT id, email, password_hash, password_salt, is_admin FROM users WHERE email = ?",
  )
    .bind(email)
    .first<UserRow>();
  if (!row) {
    return json({ error: "E-mailadres of wachtwoord is onjuist." }, 401);
  }
  const hash = await hashPassword(password, decodeBase64(row.password_salt));
  if (encodeBase64(hash) !== row.password_hash) {
    return json({ error: "E-mailadres of wachtwoord is onjuist." }, 401);
  }
  const session = await createSession(row.id, env);
  return authJson(
    { user: { email: row.email, id: row.id, isAdmin: row.is_admin === 1 } },
    200,
    sessionCookie(session.token, SESSION_DAYS * 24 * 60 * 60),
  );
}

async function logout(request: Request, env: Env): Promise<Response> {
  await ensureAccountTables(env);
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) {
    const tokenHash = encodeBase64(await sha256(textEncoder.encode(token)));
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }
  return authJson({ ok: true }, 200, sessionCookie("", 0));
}

async function authMe(request: Request, env: Env): Promise<Response> {
  await ensureAccountTables(env);
  const user = await currentUser(request, env);
  return user ? json({ user }) : json({ user: null });
}

async function requireUser(
  request: Request,
  env: Env,
): Promise<SessionUser | Response> {
  await ensureAccountTables(env);
  const user = await currentUser(request, env);
  return user ?? json({ error: "Log eerst in om dit te gebruiken." }, 401);
}

async function getFavorites(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (user instanceof Response) {
    return user;
  }
  const rows = await env.DB.prepare(
    "SELECT recipe_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC",
  )
    .bind(user.id)
    .all<{ recipe_id: string }>();
  return json(rows.results.map((row) => row.recipe_id));
}

async function saveFavorites(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (user instanceof Response) {
    return user;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "De aanvraag moet geldige JSON bevatten." }, 400);
  }
  const ids = Array.isArray(body)
    ? body.filter(
        (id): id is string => typeof id === "string" && id.length <= 200,
      )
    : null;
  if (!ids || ids.length > 500) {
    return json({ error: "De favorieten zijn ongeldig." }, 400);
  }
  await env.DB.prepare("DELETE FROM user_favorites WHERE user_id = ?")
    .bind(user.id)
    .run();
  if (ids.length > 0) {
    await env.DB.batch(
      [...new Set(ids)].map((id) =>
        env.DB.prepare(
          "INSERT OR IGNORE INTO user_favorites (user_id, recipe_id) VALUES (?, ?)",
        ).bind(user.id, id),
      ),
    );
  }
  return json([...new Set(ids)]);
}

async function getAccountWeekMenu(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = await requireUser(request, env);
  if (user instanceof Response) {
    return user;
  }
  const row = await env.DB.prepare(
    "SELECT menu_json FROM user_week_menus WHERE user_id = ?",
  )
    .bind(user.id)
    .first<WeekMenuRow>();
  if (!row) {
    return json({});
  }
  try {
    const menu = validWeekMenu(JSON.parse(row.menu_json) as unknown);
    return menu ? json(menu) : json({});
  } catch {
    return json({});
  }
}

async function saveAccountWeekMenu(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = await requireUser(request, env);
  if (user instanceof Response) {
    return user;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "De aanvraag moet geldige JSON bevatten." }, 400);
  }
  const menu = validWeekMenu(body);
  if (!menu) {
    return json({ error: "Het weekmenu is ongeldig." }, 400);
  }
  await env.DB.prepare(
    `INSERT INTO user_week_menus (user_id, menu_json, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       menu_json = excluded.menu_json,
       updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(user.id, JSON.stringify(menu))
    .run();
  return json(menu);
}

function clientIdFromRequest(request: Request): string | null {
  const clientId = new URL(request.url).searchParams.get("clientId")?.trim();
  return clientId && clientId.length <= 100 ? clientId : null;
}

function validWeekMenu(input: unknown): Record<string, string> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }
  const result: Record<string, string> = {};
  for (const [day, recipeId] of Object.entries(input)) {
    if (!WEEKDAYS.has(day) || typeof recipeId !== "string") {
      return null;
    }
    if (recipeId.length > 200) {
      return null;
    }
    result[day] = recipeId;
  }
  return result;
}

async function ensureWeekMenuTable(env: Env): Promise<void> {
  if (!weekMenuTableReady) {
    weekMenuTableReady = env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS week_menus (
        client_id TEXT PRIMARY KEY NOT NULL,
        menu_json TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    )
      .run()
      .then(() => undefined);
  }
  await weekMenuTableReady;
}

async function getWeekMenu(request: Request, env: Env): Promise<Response> {
  const clientId = clientIdFromRequest(request);
  if (!clientId) {
    return json({ error: "Een geldige client-id is vereist." }, 400);
  }
  await ensureWeekMenuTable(env);
  const row = await env.DB.prepare(
    "SELECT menu_json FROM week_menus WHERE client_id = ?",
  )
    .bind(clientId)
    .first<WeekMenuRow>();
  if (!row) {
    return json({});
  }
  try {
    const menu = validWeekMenu(JSON.parse(row.menu_json) as unknown);
    return menu ? json(menu) : json({});
  } catch {
    return json({});
  }
}

async function saveWeekMenu(request: Request, env: Env): Promise<Response> {
  const clientId = clientIdFromRequest(request);
  if (!clientId) {
    return json({ error: "Een geldige client-id is vereist." }, 400);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "De aanvraag moet geldige JSON bevatten." }, 400);
  }
  const menu = validWeekMenu(body);
  if (!menu) {
    return json({ error: "Het weekmenu is ongeldig." }, 400);
  }
  await ensureWeekMenuTable(env);
  await env.DB.prepare(
    `INSERT INTO week_menus (client_id, menu_json, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(client_id) DO UPDATE SET
       menu_json = excluded.menu_json,
       updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(clientId, JSON.stringify(menu))
    .run();
  return json(menu);
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
      if (path === "/api/auth/register" && request.method === "POST") {
        return await register(request, env);
      }
      if (path === "/api/auth/login" && request.method === "POST") {
        return await login(request, env);
      }
      if (path === "/api/auth/logout" && request.method === "POST") {
        return await logout(request, env);
      }
      if (path === "/api/auth/me" && request.method === "GET") {
        return await authMe(request, env);
      }
      if (path === "/api/account/favorites" && request.method === "GET") {
        return await getFavorites(request, env);
      }
      if (path === "/api/account/favorites" && request.method === "PUT") {
        return await saveFavorites(request, env);
      }
      if (path === "/api/account/week-menu" && request.method === "GET") {
        return await getAccountWeekMenu(request, env);
      }
      if (path === "/api/account/week-menu" && request.method === "PUT") {
        return await saveAccountWeekMenu(request, env);
      }
      if (path === "/api/admin/import" && request.method === "POST") {
        return adminRequired(request) ?? (await importRecipe(request, env));
      }
      if (path === "/api/admin/import-image" && request.method === "POST") {
        return (
          adminRequired(request) ?? (await importRecipeImage(request, env))
        );
      }
      if (path === "/api/admin/import-pdfs" && request.method === "POST") {
        return adminRequired(request) ?? (await importRecipePdfs(request, env));
      }
      if (path === "/api/import" && request.method === "POST") {
        return adminRequired(request) ?? (await importRecipe(request, env));
      }
      if (path === "/api/import-image" && request.method === "POST") {
        return (
          adminRequired(request) ?? (await importRecipeImage(request, env))
        );
      }
      if (path === "/api/week-menu" && request.method === "GET") {
        return await getWeekMenu(request, env);
      }
      if (path === "/api/week-menu" && request.method === "PUT") {
        return await saveWeekMenu(request, env);
      }
      if (path === "/api/recipes" && request.method === "GET") {
        return await listRecipes(env);
      }
      if (path === "/api/recipes" && request.method === "POST") {
        return adminRequired(request) ?? (await createRecipe(request, env));
      }
      if (path === "/api/admin/recipes" && request.method === "POST") {
        return adminRequired(request) ?? (await createRecipe(request, env));
      }
      if (path.startsWith("/api/admin/recipes/")) {
        const id = decodeURIComponent(path.slice("/api/admin/recipes/".length));
        const denied = adminRequired(request);
        if (denied) {
          return denied;
        }
        if (request.method === "PUT") {
          return await updateRecipe(id, request, env);
        }
        if (request.method === "DELETE") {
          return await deleteRecipe(id, env);
        }
      }
      if (path.startsWith("/api/recipes/")) {
        const id = decodeURIComponent(path.slice("/api/recipes/".length));
        if (request.method === "GET") {
          return await getRecipe(id, env);
        }
        if (request.method === "PUT" || request.method === "DELETE") {
          const denied = adminRequired(request);
          if (denied) {
            return denied;
          }
          return request.method === "PUT"
            ? await updateRecipe(id, request, env)
            : await deleteRecipe(id, env);
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

import {
  json,
  jsonError,
  setCookie,
  clearCookie,
  SESSION_COOKIE,
  SESSION_DAYS,
} from "../utils/http";
import { createAuthService } from "../services/auth";

export interface Env {
  DB: D1Database;
}

export async function handleAuthRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;

  const service = createAuthService(env.DB);

  if (path === "/api/auth/register" && method === "POST") {
    return register(request, service);
  }
  if (path === "/api/auth/login" && method === "POST") {
    return login(request, service);
  }
  if (path === "/api/auth/logout" && method === "POST") {
    return logout(request, service);
  }
  if (path === "/api/auth/me" && method === "GET") {
    return me(request, service);
  }

  return json({ error: "Niet gevonden." }, 404);
}

async function register(
  request: Request,
  service: ReturnType<typeof import("../services/auth").createAuthService>,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("De aanvraag moet geldige JSON bevatten.", 400);
  }

  const source =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email = String(source.email ?? "").trim();
  const password = String(source.password ?? "").trim();

  if (!email || !password) {
    return jsonError("E-mailadres en wachtwoord zijn verplicht.", 400);
  }

  try {
    const result = await service.register(email, password);
    return json(
      { user: result.user },
      201,
      setCookie(SESSION_COOKIE, result.token, SESSION_DAYS * 24 * 60 * 60),
    );
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Registratie mislukt.",
      400,
    );
  }
}

async function login(
  request: Request,
  service: ReturnType<typeof import("../services/auth").createAuthService>,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("De aanvraag moet geldige JSON bevatten.", 400);
  }

  const source =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email = String(source.email ?? "").trim();
  const password = String(source.password ?? "").trim();

  if (!email || !password) {
    return jsonError("E-mailadres en wachtwoord zijn verplicht.", 400);
  }

  try {
    const result = await service.login(email, password);
    return json(
      { user: result.user },
      200,
      setCookie(SESSION_COOKIE, result.token, SESSION_DAYS * 24 * 60 * 60),
    );
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Inloggen mislukt.", 401);
  }
}

async function logout(
  request: Request,
  service: ReturnType<typeof import("../services/auth").createAuthService>,
): Promise<Response> {
  await service.logout(request);
  return json({ ok: true }, 200, clearCookie(SESSION_COOKIE));
}

async function me(
  request: Request,
  service: ReturnType<typeof import("../services/auth").createAuthService>,
): Promise<Response> {
  const user = await service.me(request);
  return user ? json({ user }) : json({ user: null });
}

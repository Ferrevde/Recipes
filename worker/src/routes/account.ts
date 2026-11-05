import { json, jsonError, getCookie, SESSION_COOKIE } from "../utils/http";
import { getSessionUser } from "../utils/crypto";
import { createAccountService } from "../services/account";

export interface Env {
  DB: D1Database;
}

export async function handleAccountRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;

  // Get authenticated user
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) {
    return jsonError("Log eerst in om dit te gebruiken.", 401);
  }
  const user = await getSessionUser(request, { DB: env.DB });
  if (!user) {
    return jsonError("Log eerst in om dit te gebruiken.", 401);
  }

  const service = createAccountService(env.DB);

  if (path === "/api/account/favorites" && method === "GET") {
    const ids = await service.getFavorites(user.id);
    return json(ids);
  }
  if (path === "/api/account/favorites" && method === "PUT") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("De aanvraag moet geldige JSON bevatten.", 400);
    }
    const ids = Array.isArray(body)
      ? body.filter(
          (id): id is string => typeof id === "string" && id.length <= 200,
        )
      : null;
    if (!ids || ids.length > 500) {
      return jsonError("De favorieten zijn ongeldig.", 400);
    }
    await service.saveFavorites(user.id, ids);
    return json([...new Set(ids)]);
  }

  if (path === "/api/account/week-menu" && method === "GET") {
    const menu = await service.getWeekMenu(user.id);
    return json(menu);
  }
  if (path === "/api/account/week-menu" && method === "PUT") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("De aanvraag moet geldige JSON bevatten.", 400);
    }
    const { validateWeekMenu } = await import("../utils/validation");
    const menu = validateWeekMenu(body);
    if (!menu) {
      return jsonError("Het weekmenu is ongeldig.", 400);
    }
    await service.saveWeekMenu(user.id, menu);
    return json(menu);
  }

  return jsonError("Niet gevonden.", 404);
}

import { json, jsonError } from "../utils/http";
import { validateWeekMenu } from "../utils/validation";

export async function handleWeekMenuRequest(
  request: Request,
  env: { DB: D1Database },
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;

  // Legacy week menu uses clientId query param
  const clientId = url.searchParams.get("clientId")?.trim();
  if (!clientId || clientId.length > 100) {
    return jsonError("Een geldige client-id is vereist.", 400);
  }

  // Ensure table exists
  await ensureWeekMenuTable(env.DB);

  if (path === "/api/week-menu" && method === "GET") {
    const row = await env.DB.prepare(
      "SELECT menu_json FROM week_menus WHERE client_id = ?",
    )
      .bind(clientId)
      .first<{ menu_json: string }>();
    if (!row) return json({});
    try {
      const menu = validateWeekMenu(JSON.parse(row.menu_json) as unknown);
      return menu ? json(menu) : json({});
    } catch {
      return json({});
    }
  }

  if (path === "/api/week-menu" && method === "PUT") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("De aanvraag moet geldige JSON bevatten.", 400);
    }
    const menu = validateWeekMenu(body);
    if (!menu) {
      return jsonError("Het weekmenu is ongeldig.", 400);
    }
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

  return jsonError("Niet gevonden.", 404);
}

async function ensureWeekMenuTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS week_menus (
      client_id TEXT PRIMARY KEY NOT NULL,
      menu_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    )
    .run();
}

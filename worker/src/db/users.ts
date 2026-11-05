export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  is_admin: number;
}

export interface WeekMenuRow {
  menu_json: string;
}

export async function createUser(db: D1Database, user: UserRow): Promise<void> {
  await db
    .prepare(
      "INSERT INTO users (id, email, password_hash, password_salt, is_admin) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(
      user.id,
      user.email,
      user.password_hash,
      user.password_salt,
      user.is_admin,
    )
    .run();
}

export async function getUserByEmail(
  db: D1Database,
  email: string,
): Promise<UserRow | null> {
  return db
    .prepare(
      "SELECT id, email, password_hash, password_salt, is_admin FROM users WHERE email = ?",
    )
    .bind(email.toLowerCase())
    .first<UserRow>();
}

export async function createSession(
  db: D1Database,
  tokenHash: string,
  userId: string,
  expiresAt: string,
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    )
    .bind(tokenHash, userId, expiresAt)
    .run();
}

export async function getSession(
  db: D1Database,
  tokenHash: string,
): Promise<{ id: string; email: string; isAdmin: boolean } | null> {
  const row = await db
    .prepare(
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

export async function deleteSession(
  db: D1Database,
  tokenHash: string,
): Promise<void> {
  await db
    .prepare("DELETE FROM sessions WHERE token_hash = ?")
    .bind(tokenHash)
    .run();
}

export async function getFavorites(
  db: D1Database,
  userId: string,
): Promise<string[]> {
  const rows = await db
    .prepare(
      "SELECT recipe_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(userId)
    .all<{ recipe_id: string }>();
  return rows.results.map((r) => r.recipe_id);
}

export async function saveFavorites(
  db: D1Database,
  userId: string,
  ids: string[],
): Promise<void> {
  await db
    .prepare("DELETE FROM user_favorites WHERE user_id = ?")
    .bind(userId)
    .run();
  if (ids.length > 0) {
    const uniqueIds = [...new Set(ids)];
    await db.batch(
      uniqueIds.map((id) =>
        db
          .prepare(
            "INSERT OR IGNORE INTO user_favorites (user_id, recipe_id) VALUES (?, ?)",
          )
          .bind(userId, id),
      ),
    );
  }
}

export async function getWeekMenu(
  db: D1Database,
  userId: string,
): Promise<Record<string, string>> {
  const row = await db
    .prepare("SELECT menu_json FROM user_week_menus WHERE user_id = ?")
    .bind(userId)
    .first<WeekMenuRow>();
  if (!row) return {};
  try {
    return JSON.parse(row.menu_json) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function saveWeekMenu(
  db: D1Database,
  userId: string,
  menu: Record<string, string>,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO user_week_menus (user_id, menu_json, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       menu_json = excluded.menu_json,
       updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(userId, JSON.stringify(menu))
    .run();
}

export async function getLegacyWeekMenu(
  db: D1Database,
  clientId: string,
): Promise<Record<string, string>> {
  const row = await db
    .prepare("SELECT menu_json FROM week_menus WHERE client_id = ?")
    .bind(clientId)
    .first<{ menu_json: string }>();
  if (!row) return {};
  try {
    return JSON.parse(row.menu_json) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function saveLegacyWeekMenu(
  db: D1Database,
  clientId: string,
  menu: Record<string, string>,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO week_menus (client_id, menu_json, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(client_id) DO UPDATE SET
       menu_json = excluded.menu_json,
       updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(clientId, JSON.stringify(menu))
    .run();
}

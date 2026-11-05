import { SESSION_COOKIE, SESSION_DAYS, getCookie } from "./http";

const textEncoder = new TextEncoder();
const PASSWORD_ITERATIONS = 100_000;

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function sha256(value: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", value));
}

export async function hashPassword(
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

export async function verifyPassword(
  password: string,
  saltB64: string,
  hashB64: string,
): Promise<boolean> {
  const salt = decodeBase64(saltB64);
  const hash = await hashPassword(password, salt);
  return encodeBase64(hash) === hashB64;
}

export { encodeBase64 };

export async function createSession(
  userId: string,
  env: { DB: D1Database },
): Promise<{ token: string; expiresAt: string }> {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = encodeBase64(tokenBytes)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
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

export async function getSessionUser(
  request: Request,
  env: { DB: D1Database },
): Promise<{ id: string; email: string; isAdmin: boolean } | null> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
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

export async function deleteSession(
  request: Request,
  env: { DB: D1Database },
): Promise<void> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return;
  const tokenHash = encodeBase64(await sha256(textEncoder.encode(token)));
  await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
    .bind(tokenHash)
    .run();
}

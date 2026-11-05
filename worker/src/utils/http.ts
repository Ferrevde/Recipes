export const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export function json(data: unknown, status = 200, cookie?: string): Response {
  const headers = { ...corsHeaders, "Cache-Control": "no-store" };
  if (cookie) {
    (headers as Record<string, string>)["Set-Cookie"] = cookie;
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export function jsonError(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get("Cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const [key, ...parts] = cookie.trim().split("=");
    if (key === name) {
      return parts.join("=") || null;
    }
  }
  return null;
}

export function setCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearCookie(name: string): string {
  return `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export const SESSION_COOKIE = "recipes_session";
export const SESSION_DAYS = 30;

export function hasAdminAccess(request: Request): boolean {
  return Boolean(
    request.headers.get("CF-Access-Authenticated-User-Email")?.trim(),
  );
}

export function requireAdmin(request: Request): Response | null {
  return hasAdminAccess(request)
    ? null
    : jsonError("Cloudflare Access-adminrechten zijn vereist.", 403);
}

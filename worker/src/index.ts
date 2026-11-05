import { jsonError } from "./utils/http";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");

    try {
      // API routes - order matters, more specific first
      if (path.startsWith("/api/auth/")) {
        const { handleAuthRequest } = await import("./routes/auth");
        return handleAuthRequest(request, env);
      }
      if (path.startsWith("/api/account/")) {
        const { handleAccountRequest } = await import("./routes/account");
        return handleAccountRequest(request, env);
      }
      if (path.startsWith("/api/admin/")) {
        const { handleAdminRequest } = await import("./routes/admin");
        return handleAdminRequest(request, env);
      }
      if (path === "/api/week-menu" || path.startsWith("/api/week-menu/")) {
        const { handleWeekMenuRequest } = await import("./routes/week-menu");
        return handleWeekMenuRequest(request, env);
      }
      if (
        path.startsWith("/api/recipes") ||
        path.startsWith("/api/admin/recipes")
      ) {
        const { handleRecipesRequest } = await import("./routes/recipes");
        return handleRecipesRequest(request, env);
      }

      // Serve frontend assets for everything else
      if (request.method === "GET" || request.method === "HEAD") {
        return env.ASSETS.fetch(request);
      }

      return jsonError("Niet gevonden.", 404);
    } catch (error) {
      console.error(error);
      return jsonError(
        "De receptenservice is tijdelijk niet beschikbaar.",
        500,
      );
    }
  },
};

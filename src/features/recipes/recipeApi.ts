import type { Recipe } from "../../../shared/recipe";
import { validateRecipe } from "../../../shared/recipe";
import { recipeCatalog } from "./recipeCatalog";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
export type RecipeInput = Omit<Recipe, "id">;

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export type Weekday =
  | "maandag"
  | "dinsdag"
  | "woensdag"
  | "donderdag"
  | "vrijdag"
  | "zaterdag"
  | "zondag";
export type WeekMenu = Partial<Record<Weekday, string>>;

function remoteUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function readRecipeResponse(response: Response): Promise<Recipe[]> {
  if (!response.ok) {
    throw new Error(`De receptenservice gaf ${response.status}.`);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error("De receptenservice gaf an invalid response.");
  }
  return body
    .map(validateRecipe)
    .filter((recipe): recipe is Recipe => recipe !== null);
}

function mergeRecipes(remoteRecipes: Recipe[]): Recipe[] {
  const byId = new Map(recipeCatalog.map((recipe) => [recipe.id, recipe]));
  for (const recipe of remoteRecipes) {
    byId.set(recipe.id, recipe);
  }
  return [...byId.values()];
}

async function storedRecipe(id: string): Promise<Recipe | null> {
  const response = await fetch(
    remoteUrl(`/api/recipes/${encodeURIComponent(id)}`),
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`De receptenservice gaf ${response.status}.`);
  }
  return validateRecipe(await response.json());
}

async function apiError(response: Response, fallback: string): Promise<Error> {
  const body: unknown = await response.json().catch(() => null);
  const message =
    body && typeof body === "object" && "error" in body
      ? String(body.error)
      : fallback;
  return new Error(message);
}

function isAuthUser(input: unknown): input is AuthUser {
  return Boolean(
    input &&
    typeof input === "object" &&
    "id" in input &&
    typeof input.id === "string" &&
    "email" in input &&
    typeof input.email === "string" &&
    "isAdmin" in input &&
    typeof input.isAdmin === "boolean",
  );
}

function isWeekMenu(input: unknown): input is WeekMenu {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return false;
  }
  return Object.entries(input).every(
    ([day, recipeId]) =>
      [
        "maandag",
        "dinsdag",
        "woensdag",
        "donderdag",
        "vrijdag",
        "zaterdag",
        "zondag",
      ].includes(day) && typeof recipeId === "string",
  );
}

async function authenticate(
  path: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = await fetch(remoteUrl(path), {
    body: JSON.stringify({ email, password }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw await apiError(response, "Inloggen mislukt.");
  }
  const body: unknown = await response.json();
  const user =
    body && typeof body === "object" && "user" in body ? body.user : null;
  if (!isAuthUser(user)) {
    throw new Error("De accountservice gaf een ongeldige reactie.");
  }
  return user;
}

export const authApi = {
  async me(): Promise<AuthUser | null> {
    const response = await fetch(remoteUrl("/api/auth/me"), {
      credentials: "include",
    });
    if (!response.ok) {
      throw await apiError(
        response,
        "De accountstatus kon niet worden geladen.",
      );
    }
    const body: unknown = await response.json();
    const user =
      body && typeof body === "object" && "user" in body ? body.user : null;
    return isAuthUser(user) ? user : null;
  },
  async login(email: string, password: string): Promise<AuthUser> {
    return authenticate("/api/auth/login", email, password);
  },
  async register(email: string, password: string): Promise<AuthUser> {
    return authenticate("/api/auth/register", email, password);
  },
  async logout(): Promise<void> {
    const response = await fetch(remoteUrl("/api/auth/logout"), {
      credentials: "include",
      method: "POST",
    });
    if (!response.ok) {
      throw await apiError(response, "Uitloggen mislukt.");
    }
  },
};

export const accountApi = {
  async favorites(): Promise<string[]> {
    const response = await fetch(remoteUrl("/api/account/favorites"), {
      credentials: "include",
    });
    if (!response.ok) {
      throw await apiError(
        response,
        "Log eerst in om favorieten te gebruiken.",
      );
    }
    const body: unknown = await response.json();
    return Array.isArray(body)
      ? body.filter((id): id is string => typeof id === "string")
      : [];
  },
  async saveFavorites(ids: string[]): Promise<string[]> {
    const response = await fetch(remoteUrl("/api/account/favorites"), {
      body: JSON.stringify(ids),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    if (!response.ok) {
      throw await apiError(
        response,
        "Favorieten konden niet worden opgeslagen.",
      );
    }
    return (await response.json()) as string[];
  },
  async weekMenu(): Promise<WeekMenu> {
    const response = await fetch(remoteUrl("/api/account/week-menu"), {
      credentials: "include",
    });
    if (!response.ok) {
      throw await apiError(
        response,
        "Log eerst in om een weekmenu te gebruiken.",
      );
    }
    const body: unknown = await response.json();
    return isWeekMenu(body) ? body : {};
  },
  async saveWeekMenu(menu: WeekMenu): Promise<WeekMenu> {
    const response = await fetch(remoteUrl("/api/account/week-menu"), {
      body: JSON.stringify(menu),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    if (!response.ok) {
      throw await apiError(
        response,
        "Het weekmenu kon niet worden opgeslagen.",
      );
    }
    const body: unknown = await response.json();
    return isWeekMenu(body) ? body : menu;
  },
};

export const recipesApi = {
  async list(): Promise<Recipe[]> {
    try {
      return mergeRecipes(
        await readRecipeResponse(await fetch(remoteUrl("/api/recipes"))),
      );
    } catch {
      return recipeCatalog;
    }
  },

  async byId(id: string): Promise<Recipe | null> {
    try {
      return (
        (await storedRecipe(id)) ??
        recipeCatalog.find((recipe) => recipe.id === id) ??
        null
      );
    } catch {
      return recipeCatalog.find((recipe) => recipe.id === id) ?? null;
    }
  },

  async storedById(id: string): Promise<Recipe | null> {
    return storedRecipe(id);
  },

  async importFromUrl(url: string): Promise<RecipeInput> {
    const response = await fetch(remoteUrl("/api/import"), {
      body: JSON.stringify({ url }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message =
        body && typeof body === "object" && "error" in body
          ? String(body.error)
          : "Het recept kon niet worden geïmporteerd.";
      throw new Error(message);
    }
    const recipe = validateRecipe({
      id: "import-preview",
      ...(await response.json()),
    });
    if (!recipe) {
      throw new Error("De import gaf geen geldig recept terug.");
    }
    const { id: _id, ...input } = recipe;
    return input;
  },

  async importFromImage(image: File): Promise<RecipeInput> {
    const form = new FormData();
    form.set("image", image);
    const response = await fetch(remoteUrl("/api/import-image"), {
      body: form,
      credentials: "include",
      method: "POST",
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message =
        body && typeof body === "object" && "error" in body
          ? String(body.error)
          : "De screenshot kon niet worden geïmporteerd.";
      throw new Error(message);
    }
    const recipe = validateRecipe({
      id: "image-preview",
      ...(await response.json()),
    });
    if (!recipe) {
      throw new Error("De screenshot gaf geen geldig recept terug.");
    }
    const { id: _id, ...input } = recipe;
    return input;
  },

  async create(input: RecipeInput): Promise<Recipe> {
    return sendRecipe("POST", "/api/admin/recipes", input);
  },

  async update(id: string, input: RecipeInput): Promise<Recipe> {
    return sendRecipe(
      "PUT",
      `/api/admin/recipes/${encodeURIComponent(id)}`,
      input,
    );
  },

  async remove(id: string): Promise<void> {
    const response = await fetch(
      remoteUrl(`/api/admin/recipes/${encodeURIComponent(id)}`),
      {
        credentials: "include",
        method: "DELETE",
      },
    );
    if (!response.ok) {
      throw new Error(`De receptenservice gaf ${response.status}.`);
    }
  },
};

async function sendRecipe(
  method: "POST" | "PUT",
  path: string,
  input: RecipeInput,
): Promise<Recipe> {
  const response = await fetch(remoteUrl(path), {
    body: JSON.stringify(input),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method,
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "error" in body
        ? String(body.error)
        : `De receptenservice gaf ${response.status}.`;
    throw new Error(message);
  }
  const recipe = validateRecipe(await response.json());
  if (!recipe) {
    throw new Error("De receptenservice gaf an invalid recipe.");
  }
  return recipe;
}

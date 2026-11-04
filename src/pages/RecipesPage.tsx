import { Bookmark, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Recipe, RecipeCategory } from "../../shared/recipe";
import { recipeCategories, recipeCategoryLabels } from "../../shared/recipe";
import { useAuth } from "../features/auth/AuthContext";
import { accountApi, recipesApi } from "../features/recipes/recipeApi";
import { RecipeCard } from "../features/recipes/RecipeCard";
import { PageHeader } from "../components/PageHeader";

export function RecipesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | "all">(
    () => {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("category");
      return fromUrl && recipeCategories.includes(fromUrl as RecipeCategory)
        ? (fromUrl as RecipeCategory)
        : "all";
    },
  );
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      return;
    }
    void accountApi
      .favorites()
      .then((remoteIds) => {
        const raw = window.localStorage.getItem("recipes.savedIds");
        let legacyIds: string[] = [];
        try {
          const parsed: unknown = raw ? JSON.parse(raw) : null;
          legacyIds = Array.isArray(parsed)
            ? parsed.filter((id): id is string => typeof id === "string")
            : [];
        } catch {
          legacyIds = [];
        }
        const next =
          remoteIds.length === 0 && legacyIds.length > 0
            ? [...new Set(legacyIds)]
            : remoteIds;
        setSavedIds(next);
        if (next.length > 0 && remoteIds.length === 0) {
          void accountApi.saveFavorites(next);
        }
        if (raw) {
          window.localStorage.removeItem("recipes.savedIds");
        }
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Favorieten laden mislukt.",
        ),
      );
  }, [user]);

  useEffect(() => {
    void recipesApi
      .list()
      .then(setRecipes)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Laden mislukt."),
      );
  }, []);

  function toggleFavorite(id: string) {
    if (!user) {
      navigate(`/login?returnTo=${encodeURIComponent("/recipes")}`);
      return;
    }
    const next = savedIds.includes(id)
      ? savedIds.filter((stored) => stored !== id)
      : [...savedIds, id];
    setSavedIds(next);
    void accountApi
      .saveFavorites(next)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Favoriet kon niet worden opgeslagen.",
        ),
      );
  }

  const filtered = useMemo(() => {
    if (recipes === null) {
      return [];
    }
    return recipes.filter((recipe) => {
      const matchesCategory =
        activeCategory === "all" || recipe.category === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        recipe.title.toLowerCase().includes(q) ||
        recipe.summary.toLowerCase().includes(q) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [recipes, query, activeCategory]);

  const savedCount = savedIds.length;

  return (
    <div className="recipes-page">
      <PageHeader
        eyebrow="De verzameling"
        title="Alle recepten"
        description="Zoek op naam, ingrediënt of tag en filter daarna op categorie."
      />

      <div className="recipes-toolbar">
        <div className="recipes-search">
          <Search
            size={16}
            strokeWidth={2}
            style={{ color: "var(--color-text-subtle)" }}
            aria-hidden="true"
          />
          <input
            type="search"
            className="recipes-search__input"
            placeholder="Recepten zoeken…"
            aria-label="Recepten zoeken"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <span className="recipes-toolbar__summary" aria-live="polite">
          {filtered.length} recept{filtered.length === 1 ? "" : "en"}
          {savedCount > 0 && ` · ${savedCount} bewaard`}
        </span>
      </div>

      <div
        className="recipe-categories"
        role="tablist"
        aria-label="Filter op categorie"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === "all"}
          className={`recipe-category-chip${
            activeCategory === "all" ? " is-active" : ""
          }`}
          onClick={() => setActiveCategory("all")}
        >
          Alles
        </button>
        {recipeCategories.map((category) => {
          const label = recipeCategoryLabels[category];
          const count =
            recipes === null
              ? 0
              : recipes.filter((recipe) => recipe.category === category).length;
          return (
            <button
              type="button"
              key={category}
              role="tab"
              aria-selected={activeCategory === category}
              className={`recipe-category-chip${
                activeCategory === category ? " is-active" : ""
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {label}
              <span className="recipe-category-chip__count">{count}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="alert alert--error">{error}</p>}

      {filtered.length === 0 && recipes !== null && (
        <p className="recipes-empty">
          Geen recepten gevonden voor je zoekopdracht.
        </p>
      )}

      {recipes === null ? (
        <p className="loading-state">Recepten laden…</p>
      ) : (
        <div className="recipes-grid">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              icon={Bookmark}
              isFavorite={savedIds.includes(recipe.id)}
              onToggleFavorite={toggleFavorite}
              onOpen={(id) => {
                navigate(`/recipes/${id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

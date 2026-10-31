import { Bookmark, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Recipe, RecipeCategory } from "../../shared/recipe";
import { recipeCategories, recipeCategoryLabels } from "../../shared/recipe";
import { recipesApi } from "../features/recipes/recipeApi";
import { RecipeCard } from "../features/recipes/RecipeCard";
import { PageHeader } from "../components/PageHeader";
import { useLocalStorage } from "../lib/localStorage";

const FAVORITES_KEY = "recipes.savedIds";

export function RecipesPage() {
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
  const [savedIds, setSavedIds] = useLocalStorage(
    FAVORITES_KEY,
    [] as string[],
  );

  useEffect(() => {
    void recipesApi
      .list()
      .then(setRecipes)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Failed to load."),
      );
  }, []);

  function toggleFavorite(id: string) {
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((stored) => stored !== id)
        : [...current, id],
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
        eyebrow="The collection"
        title="All recipes"
        description="Search by name, ingredient, or tag, then filter by category."
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
            placeholder="Search recipes…"
            aria-label="Search recipes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <span className="recipes-toolbar__summary" aria-live="polite">
          {filtered.length} recipe{filtered.length === 1 ? "" : "s"}
          {savedCount > 0 && ` · ${savedCount} saved`}
        </span>
      </div>

      <div
        className="recipe-categories"
        role="tablist"
        aria-label="Filter by category"
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
          All
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
        <p className="recipes-empty">No recipes match your search.</p>
      )}

      {recipes === null ? (
        <p className="loading-state">Loading recipes…</p>
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
                window.history.pushState({}, "", `/recipes/${id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

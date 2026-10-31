import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Recipe } from "../../shared/recipe";
import { recipeCategories, recipeCategoryLabels } from "../../shared/recipe";
import { recipesApi } from "../features/recipes/recipeApi";
import { RecipeCard } from "../features/recipes/RecipeCard";
import { UtensilsCrossed } from "lucide-react";

export function CategoriesPage() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void recipesApi
      .list()
      .then(setRecipes)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Failed to load."),
      );
  }, []);

  return (
    <div className="categories-page">
      <Link
        className="back-link"
        to="/recipes"
        aria-label="Back to all recipes"
        onClick={(event) => event.preventDefault()}
      >
        Back to all recipes
      </Link>

      <h1 className="categories-page__title">Categories</h1>

      {error && <p className="alert alert--error">{error}</p>}

      {recipes === null ? (
        <p className="loading-state">Loading recipes…</p>
      ) : recipes.length === 0 ? (
        <p className="loading-state">No recipes yet.</p>
      ) : (
        <div className="categories">
          {recipeCategories.map((category) => {
            const label = recipeCategoryLabels[category];
            const items = recipes.filter(
              (recipe) => recipe.category === category,
            );
            return (
              <section
                key={category}
                className="category"
                aria-labelledby={`${category}-heading`}
              >
                <header className="category__head">
                  <h2 id={`${category}-heading`} className="category__heading">
                    <UtensilsCrossed aria-hidden="true" size={18} />
                    {label}
                    <span className="category__count">{items.length}</span>
                  </h2>
                  <Link to={`/recipes?category=${category}`}>View recipes</Link>
                </header>

                <div className="categories-grid">
                  {items.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      icon={UtensilsCrossed}
                      isFavorite={false}
                      onToggleFavorite={() => {}}
                      onOpen={(id) => {
                        window.history.pushState({}, "", `/recipes/${id}`);
                      }}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

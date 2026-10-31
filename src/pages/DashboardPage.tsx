import { ArrowRight, ChefHat, UtensilsCrossed } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Recipe } from "../../shared/recipe";
import { recipesApi } from "../features/recipes/recipeApi";
import { RecipeCard } from "../features/recipes/RecipeCard";
import { PageHeader } from "../components/PageHeader";

const FEATURED_LIMIT = 4;

export function DashboardPage() {
  const navigate = useNavigate();
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
    <div className="dashboard">
      <PageHeader
        eyebrow="Good to cook"
        title="What will you make today?"
        description="Start with a featured recipe or browse the whole collection by category."
      />

      <section className="hero">
        <span className="hero__mark" aria-hidden="true">
          <ChefHat size={28} strokeWidth={1.6} />
        </span>
        <div className="hero__body">
          <h2 className="hero__title">Cook something you love</h2>
          <p className="hero__text">
            From quick weeknight dinners to decadent desserts, every recipe
            comes with clear steps and honest timing.
          </p>
          <Link className="hero__link" to="/recipes">
            Browse all recipes
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="recipes-grid" aria-label="Featured recipes">
        <h3 className="recipes-grid__heading">
          <UtensilsCrossed aria-hidden="true" size={20} strokeWidth={2} />
          Featured
        </h3>
        {error && <p className="alert alert--error">{error}</p>}

        {recipes === null ? (
          <p className="loading-state">Loading recipes…</p>
        ) : recipes.length === 0 ? (
          <p className="loading-state">No recipes yet.</p>
        ) : (
          <div className="recipes-grid__cards">
            {recipes.slice(0, FEATURED_LIMIT).map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                icon={UtensilsCrossed}
                isFavorite={false}
                onToggleFavorite={() => {
                  /* add favorite persistence in a future step */
                }}
                onOpen={(id) => {
                  navigate(`/recipes/${id}`);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

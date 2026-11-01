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
        setError(reason instanceof Error ? reason.message : "Laden mislukt."),
      );
  }, []);

  return (
    <div className="dashboard">
      <PageHeader
        eyebrow="Tijd om te koken"
        title="Wat maak je vandaag?"
        description="Begin met een uitgelicht recept of bekijk de hele verzameling per categorie."
      />

      <section className="hero">
        <span className="hero__mark" aria-hidden="true">
          <ChefHat size={28} strokeWidth={1.6} />
        </span>
        <div className="hero__body">
          <h2 className="hero__title">Kook iets waar je van houdt</h2>
          <p className="hero__text">
            Van snelle doordeweekse diners tot heerlijke desserts: elk recept
            bevat duidelijke stappen en een realistische bereidingstijd.
          </p>
          <Link className="hero__link" to="/recipes">
            Bekijk alle recepten
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="recipes-grid" aria-label="Uitgelichte recepten">
        <h3 className="recipes-grid__heading">
          <UtensilsCrossed aria-hidden="true" size={20} strokeWidth={2} />
          Uitgelicht
        </h3>
        {error && <p className="alert alert--error">{error}</p>}

        {recipes === null ? (
          <p className="loading-state">Recepten laden…</p>
        ) : recipes.length === 0 ? (
          <p className="loading-state">Nog geen recepten.</p>
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

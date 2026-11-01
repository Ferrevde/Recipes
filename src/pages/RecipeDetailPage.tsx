import {
  ArrowLeft,
  Bookmark,
  Clock,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Recipe } from "../../shared/recipe";
import {
  recipeCategoryLabel,
  recipeDifficultyLabel,
} from "../../shared/recipe";
import { formatIngredientAmount } from "../features/recipes/ingredientCatalog";
import { recipesApi } from "../features/recipes/recipeApi";
import {
  formatDuration,
  formatServings,
  formatTimeParts,
} from "../features/recipes/recipeFormatters";
import { useLocalStorage } from "../lib/localStorage";

export function RecipeDetailPage() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const [favoriteIds, setFavoriteIds] = useLocalStorage(
    "recipes.savedIds",
    [] as string[],
  );
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    void recipesApi
      .byId(recipeId ?? "")
      .then(setRecipe)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Laden mislukt."),
      );
  }, [recipeId]);

  useEffect(() => {
    if (!recipe) {
      return;
    }
    void recipesApi
      .storedById(recipe.id)
      .then((stored) => setCanManage(stored !== null))
      .catch(() => setCanManage(false));
  }, [recipe]);

  async function deleteCurrentRecipe() {
    if (!recipe || !window.confirm(`“${recipe.title}” verwijderen?`)) {
      return;
    }
    try {
      await recipesApi.remove(recipe.id);
      navigate("/recipes");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Het recept kon niet worden verwijderd.",
      );
    }
  }

  function toggleIngredient(index: number) {
    setCheckedIngredients((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div className="recipe-detail">
      <Link
        className="back-link"
        to="/recipes"
        aria-label="Terug naar alle recepten"
        onClick={(event) => {
          event.preventDefault();
          navigate("/recipes");
        }}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Alle recepten
      </Link>

      {error && <p className="alert alert--error">{error}</p>}

      {recipe === null && !error ? (
        <p className="loading-state">Recept laden…</p>
      ) : recipe === null ? (
        <p className="recipe-detail__not-found">
          Dit recept kon niet worden gevonden.
        </p>
      ) : (
        <>
          <header className="recipe-detail__header">
            <div>
              <p className="eyebrow">
                {recipeCategoryLabel(recipe.category)} ·{" "}
                {recipeDifficultyLabel(recipe.difficulty)}
              </p>
              <h1>{recipe.title}</h1>
            </div>

            <div className="recipe-detail__actions">
              {canManage && (
                <>
                  <Link
                    className="recipe-detail__action"
                    to={`/recipes/${recipe.id}/edit`}
                    aria-label="Recept bewerken"
                  >
                    <Pencil size={18} aria-hidden="true" />
                    Bewerken
                  </Link>
                  <button
                    type="button"
                    className="recipe-detail__action recipe-detail__action--danger"
                    onClick={deleteCurrentRecipe}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                    Verwijderen
                  </button>
                </>
              )}
              <button
                type="button"
                className="recipe-detail__favorite"
                aria-label={
                  favoriteIds.includes(recipe.id)
                    ? "Verwijder uit bewaard"
                    : "Bewaar recept"
                }
                aria-pressed={favoriteIds.includes(recipe.id)}
                onClick={() =>
                  setFavoriteIds((current) =>
                    current.includes(recipe.id)
                      ? current.filter((id) => id !== recipe.id)
                      : [...current, recipe.id],
                  )
                }
              >
                <Bookmark
                  size={20}
                  strokeWidth={2}
                  style={{
                    color: favoriteIds.includes(recipe.id)
                      ? "var(--color-accent)"
                      : "var(--color-text-muted)",
                  }}
                />
              </button>
            </div>
          </header>

          <p className="recipe-detail__summary">{recipe.summary}</p>

          <dl className="recipe-metrics">
            <div className="recipe-metrics__item">
              <Clock aria-hidden="true" size={16} strokeWidth={2} />
              <div>
                <dt>Totale tijd</dt>
                <dd>
                  {formatDuration(recipe.prepMinutes + recipe.cookMinutes)}
                </dd>
              </div>
            </div>
            <div className="recipe-metrics__item">
              <Clock aria-hidden="true" size={16} strokeWidth={2} />
              <div>
                <dt>Voorbereiding / bereiding</dt>
                <dd>
                  {formatTimeParts(recipe.prepMinutes, recipe.cookMinutes).prep}
                  {formatTimeParts(recipe.prepMinutes, recipe.cookMinutes).cook}
                </dd>
              </div>
            </div>
            <div className="recipe-metrics__item">
              <Users aria-hidden="true" size={16} strokeWidth={2} />
              <div>
                <dt>Porties</dt>
                <dd>{formatServings(recipe.servings)}</dd>
              </div>
            </div>
          </dl>

          <div className="recipe-detail__body">
            <section className="recipe-section">
              <h2>Ingrediënten</h2>
              <ul className="recipe-ingredients">
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={index}
                    className={`recipe-ingredient${
                      checkedIngredients.has(index) ? " is-checked" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="recipe-ingredient__check"
                      aria-label={`Markeer ${ingredient.title} als gebruikt`}
                      aria-pressed={checkedIngredients.has(index)}
                      onClick={() => toggleIngredient(index)}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          backgroundColor: checkedIngredients.has(index)
                            ? "var(--recipe-color)"
                            : "var(--color-border-strong)",
                        }}
                      />
                    </button>
                    <span className="recipe-ingredient__text">
                      {formatIngredientAmount(
                        ingredient.amount,
                        ingredient.unit,
                        ingredient.title,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="recipe-section">
              <h2>Stappen</h2>
              <ol className="recipe-steps">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="recipe-step">
                    <span className="recipe-step__index">{index + 1}</span>
                    <span className="recipe-step__text">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {recipe.tags.length > 0 && (
            <div className="recipe-detail__tags">
              {recipe.tags.map((tag) => (
                <span key={tag} className="recipe-tag recipe-tag--accent">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

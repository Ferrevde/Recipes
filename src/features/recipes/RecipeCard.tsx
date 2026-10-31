import type { LucideIcon } from "lucide-react";
import type { Recipe } from "../../../shared/recipe";
import { recipeCategoryLabel } from "../../../shared/recipe";
import { formatServings, formatTotalTime } from "./recipeFormatters";

interface RecipeCardProps {
  recipe: Recipe;
  icon: LucideIcon;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
}

export function RecipeCard({
  recipe,
  icon: CategoryIcon,
  isFavorite,
  onToggleFavorite,
  onOpen,
}: RecipeCardProps) {
  return (
    <article className="recipe-card">
      <button
        type="button"
        className="recipe-card__favorite"
        aria-label={isFavorite ? "Remove from saved" : "Save recipe"}
        aria-pressed={isFavorite}
        onClick={() => onToggleFavorite(recipe.id)}
      >
        <CategoryIcon
          size={18}
          strokeWidth={1.8}
          style={{
            color: isFavorite
              ? "var(--recipe-color)"
              : "var(--color-text-subtle)",
          }}
        />
      </button>

      <div className="recipe-card__body" onClick={() => onOpen(recipe.id)}>
        <header className="recipe-card__head">
          <span className="recipe-pill recipe-pill--recipe">
            {recipeCategoryLabel(recipe.category)}
          </span>
          <span className="recipe-card__metrics">
            <span title="Total time">{formatTotalTime(recipe)}</span>
            <span title="Servings">
              {formatServings(recipe.servings, "serves")}
            </span>
          </span>
        </header>

        <h3 className="recipe-card__title">{recipe.title}</h3>

        <p className="recipe-card__summary">{recipe.summary}</p>

        <div className="recipe-card__tags">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="recipe-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

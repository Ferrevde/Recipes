import { Bookmark, ChefHat, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Recipe, RecipeCategory } from "../../shared/recipe";
import { recipeCategoryLabel } from "../../shared/recipe";
import { PageHeader } from "../components/PageHeader";
import { recipesApi } from "../features/recipes/recipeApi";
import { useLocalStorage } from "../lib/localStorage";

interface PreferenceRow {
  label: string;
  value: string;
  icon: typeof ChefHat;
}

function favouriteCategory(recipes: Recipe[]): string {
  if (recipes.length === 0) {
    return "Nog geen";
  }
  const counts = new Map<RecipeCategory, number>();
  for (const recipe of recipes) {
    counts.set(recipe.category, (counts.get(recipe.category) ?? 0) + 1);
  }
  let best: RecipeCategory | null = null;
  let bestCount = 0;
  for (const [category, count] of counts) {
    if (count > bestCount) {
      best = category;
      bestCount = count;
    }
  }
  return best === null ? "Nog geen" : recipeCategoryLabel(best);
}

export function ProfilePage() {
  const [savedIds] = useLocalStorage("recipes.savedIds", [] as string[]);
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

  const savedCount = useMemo(() => {
    if (!recipes) {
      return 0;
    }
    const ids = new Set(recipes.map((recipe) => recipe.id));
    return savedIds.filter((id) => ids.has(id)).length;
  }, [recipes, savedIds]);

  const preferences: PreferenceRow[] = [
    {
      label: "Favoriete categorie",
      value: recipes ? favouriteCategory(recipes) : "…",
      icon: UtensilsCrossed,
    },
    {
      label: "Totaal aantal recepten",
      value: recipes ? String(recipes.length) : "…",
      icon: ChefHat,
    },
    {
      label: "Bewaarde recepten",
      value: recipes ? String(savedCount) : "…",
      icon: Bookmark,
    },
  ];

  return (
    <div className="profile-page">
      <PageHeader
        eyebrow="Jouw boek"
        title="Profiel"
        description="Een kort overzicht van je receptenverzameling."
      />

      {error && <p className="alert alert--error">{error}</p>}

      <section className="profile-card">
        <h2>Snelle statistieken</h2>
        <dl className="profile-preferences">
          {preferences.map((row) => (
            <div key={row.label} className="profile-preference">
              <dt>
                <row.icon aria-hidden="true" size={16} strokeWidth={2} />
                {row.label}
              </dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="profile-card">
        <h2>Over de verzameling</h2>
        <p className="profile-card__text">
          Receptenboek houdt alles op één plek: blader per categorie, zoek op
          naam of ingrediënt en bewaar recepten die je opnieuw wilt koken. Voeg
          je eigen recepten toe om de verzameling verder uit te bouwen.
        </p>
      </section>
    </div>
  );
}

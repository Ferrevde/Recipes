import { CalendarDays, Check, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Recipe } from "../../shared/recipe";
import { recipeCategoryLabel } from "../../shared/recipe";
import { PageHeader } from "../components/PageHeader";
import { recipesApi } from "../features/recipes/recipeApi";
import { formatTotalTime } from "../features/recipes/recipeFormatters";
import { useLocalStorage } from "../lib/localStorage";

const WEEKDAYS = [
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag",
] as const;

type Weekday = (typeof WEEKDAYS)[number];
type WeekMenu = Partial<Record<Weekday, string>>;

const WEEK_MENU_KEY = "recipes.weekMenu";

export function WeekMenuPage() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeDay, setActiveDay] = useState<Weekday>("maandag");
  const [weekMenu, setWeekMenu] = useLocalStorage<WeekMenu>(WEEK_MENU_KEY, {});

  useEffect(() => {
    void recipesApi
      .list()
      .then(setRecipes)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Laden mislukt."),
      );
  }, []);

  const recipesById = useMemo(
    () => new Map((recipes ?? []).map((recipe) => [recipe.id, recipe])),
    [recipes],
  );

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("nl");
    if (!recipes) {
      return [];
    }
    return recipes.filter((recipe) => {
      if (!normalizedQuery) {
        return true;
      }
      return (
        recipe.title.toLocaleLowerCase("nl").includes(normalizedQuery) ||
        recipe.summary.toLocaleLowerCase("nl").includes(normalizedQuery) ||
        recipe.tags.some((tag) =>
          tag.toLocaleLowerCase("nl").includes(normalizedQuery),
        )
      );
    });
  }, [query, recipes]);

  function chooseRecipe(recipeId: string) {
    setWeekMenu((current) => ({ ...current, [activeDay]: recipeId }));
  }

  function removeRecipe(day: Weekday) {
    setWeekMenu((current) => {
      const next = { ...current };
      delete next[day];
      return next;
    });
  }

  return (
    <div className="weekmenu-page">
      <PageHeader
        eyebrow="Plannen"
        title="Mijn weekmenu"
        description="Kies per dag een recept en maak zo eenvoudig je menu voor de hele week."
      />

      {error && <p className="alert alert--error">{error}</p>}

      <section className="weekmenu-overview" aria-label="Weekmenu overzicht">
        {WEEKDAYS.map((day) => {
          const recipe = weekMenu[day]
            ? recipesById.get(weekMenu[day] ?? "")
            : undefined;
          return (
            <button
              key={day}
              type="button"
              className={`weekmenu-day${activeDay === day ? " is-active" : ""}`}
              onClick={() => setActiveDay(day)}
            >
              <span className="weekmenu-day__name">{day}</span>
              <span className="weekmenu-day__recipe">
                {recipe?.title ?? "Nog leeg"}
              </span>
            </button>
          );
        })}
      </section>

      <section className="weekmenu-current">
        <div>
          <p className="eyebrow">Geselecteerde dag</p>
          <h2>{activeDay}</h2>
        </div>
        {weekMenu[activeDay] && (
          <button
            type="button"
            className="weekmenu-clear"
            onClick={() => removeRecipe(activeDay)}
          >
            <X size={16} aria-hidden="true" />
            Verwijder recept
          </button>
        )}
      </section>

      <section className="weekmenu-picker">
        <div className="weekmenu-picker__header">
          <div>
            <h2>Kies een recept</h2>
            <p>Dit recept wordt toegevoegd aan {activeDay}.</p>
          </div>
          <div className="recipes-search weekmenu-search">
            <Search
              size={16}
              strokeWidth={2}
              style={{ color: "var(--color-text-subtle)" }}
              aria-hidden="true"
            />
            <input
              type="search"
              className="recipes-search__input"
              placeholder="Recept zoeken…"
              aria-label="Recept zoeken voor het weekmenu"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        {recipes === null ? (
          <p className="loading-state">Recepten laden…</p>
        ) : filteredRecipes.length === 0 ? (
          <p className="recipes-empty">Geen recepten gevonden.</p>
        ) : (
          <div className="weekmenu-recipes">
            {filteredRecipes.map((recipe) => {
              const isSelected = weekMenu[activeDay] === recipe.id;
              return (
                <article
                  key={recipe.id}
                  className={`weekmenu-recipe${
                    isSelected ? " is-selected" : ""
                  }`}
                >
                  <div className="weekmenu-recipe__details">
                    <span className="recipe-pill recipe-pill--recipe">
                      {recipeCategoryLabel(recipe.category)}
                    </span>
                    <h3>{recipe.title}</h3>
                    <p>
                      {formatTotalTime(recipe)} · {recipe.servings} porties
                    </p>
                  </div>
                  <button
                    type="button"
                    className="weekmenu-recipe__button"
                    aria-pressed={isSelected}
                    onClick={() => chooseRecipe(recipe.id)}
                  >
                    {isSelected ? (
                      <>
                        <Check size={16} aria-hidden="true" /> Gekozen
                      </>
                    ) : (
                      <>
                        <CalendarDays size={16} aria-hidden="true" /> Kiezen
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

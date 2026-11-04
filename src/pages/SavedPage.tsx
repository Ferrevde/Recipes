import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Recipe } from "../../shared/recipe";
import { useAuth } from "../features/auth/AuthContext";
import { accountApi, recipesApi } from "../features/recipes/recipeApi";
import { RecipeCard } from "../features/recipes/RecipeCard";
import { PageHeader } from "../components/PageHeader";

export function SavedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      return;
    }
    void accountApi
      .favorites()
      .then(setSavedIds)
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

  const savedRecipes =
    recipes === null
      ? []
      : recipes.filter((recipe) => savedIds.includes(recipe.id));

  return (
    <div className="saved-page">
      <PageHeader
        eyebrow="Jouw verzameling"
        title="Bewaarde recepten"
        description="Recepten die je voor later hebt bewaard."
      />

      {!user && (
        <p className="alert">
          Log in om je persoonlijke favorieten te bekijken.{" "}
          <button
            className="inline-action"
            type="button"
            onClick={() => navigate("/login?returnTo=/saved")}
          >
            Inloggen
          </button>
        </p>
      )}

      {error && <p className="alert alert--error">{error}</p>}

      {savedRecipes.length === 0 && recipes !== null && (
        <p className="saved-empty">
          Je hebt nog geen recepten bewaard. Tik op het bladwijzerpictogram van
          een recept om het hier te bewaren.
        </p>
      )}

      {savedRecipes.length > 0 && (
        <div className="recipes-grid">
          {savedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              icon={Bookmark}
              isFavorite
              onToggleFavorite={(id) => {
                const next = savedIds.filter((savedId) => savedId !== id);
                setSavedIds(next);
                void accountApi.saveFavorites(next);
              }}
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

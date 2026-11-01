import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  recipeCategories,
  recipeCategoryLabels,
  recipeDifficulties,
  type RecipeCategory,
  type RecipeDifficulty,
  type RecipeIngredient,
} from "../../shared/recipe";
import { recipesApi, type RecipeInput } from "../features/recipes/recipeApi";
import { PageHeader } from "../components/PageHeader";

interface IngredientDraft extends RecipeIngredient {
  key: number;
}

const initialIngredient = (key: number): IngredientDraft => ({
  amount: "",
  key,
  title: "",
  unit: "",
});

export function RecipeEditorPage() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const isEditing = recipeId !== undefined;
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<RecipeCategory>("dinner");
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>("Easy");
  const [prepMinutes, setPrepMinutes] = useState("10");
  const [cookMinutes, setCookMinutes] = useState("20");
  const [servings, setServings] = useState("2");
  const [summary, setSummary] = useState("");
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    initialIngredient(1),
  ]);
  const [steps, setSteps] = useState([""]);
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    if (!recipeId) {
      return;
    }
    void recipesApi
      .storedById(recipeId)
      .then((recipe) => {
        if (!recipe) {
          setError("Only recipes stored in D1 can be edited.");
          return;
        }
        setTitle(recipe.title);
        setCategory(recipe.category);
        setDifficulty(recipe.difficulty);
        setPrepMinutes(String(recipe.prepMinutes));
        setCookMinutes(String(recipe.cookMinutes));
        setServings(String(recipe.servings));
        setSummary(recipe.summary);
        setIngredients(
          recipe.ingredients.map((ingredient, key) => ({ ...ingredient, key })),
        );
        setSteps(recipe.steps);
        setTags(recipe.tags.join(", "));
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error ? reason.message : "Could not load recipe.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [recipeId]);

  function updateIngredient(
    key: number,
    field: keyof RecipeIngredient,
    value: string,
  ) {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.key === key ? { ...ingredient, [field]: value } : ingredient,
      ),
    );
  }

  function updateStep(index: number, value: string) {
    setSteps((current) =>
      current.map((step, stepIndex) => (stepIndex === index ? value : step)),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const input: RecipeInput = {
        category,
        cookMinutes: Number(cookMinutes),
        difficulty,
        ingredients: ingredients.map(
          ({ key: _key, ...ingredient }) => ingredient,
        ),
        prepMinutes: Number(prepMinutes),
        servings: Number(servings),
        steps,
        summary,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        title,
      };
      const saved = isEditing
        ? await recipesApi.update(recipeId, input)
        : await recipesApi.create(input);
      navigate(`/recipes/${saved.id}`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not save recipe.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="recipe-editor">
      <Link className="back-link" to="/recipes">
        <ArrowLeft size={18} aria-hidden="true" />
        All recipes
      </Link>
      <PageHeader
        eyebrow="Your collection"
        title={isEditing ? "Edit recipe" : "Add a recipe"}
        description={
          isEditing
            ? "Update this recipe in your Cloudflare D1 collection."
            : "Save a recipe to your Cloudflare D1 collection."
        }
      />

      {isLoading && <p className="loading-state">Loading recipe…</p>}
      {!isLoading && (
        <form className="recipe-editor__form" onSubmit={submit}>
          {error && <p className="alert alert--error">{error}</p>}

          <div className="recipe-editor__grid">
            <label>
              Recipe name
              <input
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Category
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as RecipeCategory)
                }
              >
                {recipeCategories.map((item) => (
                  <option key={item} value={item}>
                    {recipeCategoryLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Difficulty
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as RecipeDifficulty)
                }
              >
                {recipeDifficulties.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Servings
              <input
                required
                min="1"
                type="number"
                value={servings}
                onChange={(event) => setServings(event.target.value)}
              />
            </label>
            <label>
              Prep minutes
              <input
                required
                min="0"
                type="number"
                value={prepMinutes}
                onChange={(event) => setPrepMinutes(event.target.value)}
              />
            </label>
            <label>
              Cook minutes
              <input
                required
                min="0"
                type="number"
                value={cookMinutes}
                onChange={(event) => setCookMinutes(event.target.value)}
              />
            </label>
          </div>

          <label>
            Short description
            <textarea
              required
              maxLength={300}
              rows={3}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>

          <fieldset>
            <legend>Ingredients</legend>
            <div className="recipe-editor__rows">
              {ingredients.map((ingredient) => (
                <div className="recipe-editor__row" key={ingredient.key}>
                  <input
                    aria-label="Amount"
                    placeholder="Amount"
                    value={ingredient.amount}
                    onChange={(event) =>
                      updateIngredient(
                        ingredient.key,
                        "amount",
                        event.target.value,
                      )
                    }
                  />
                  <input
                    aria-label="Unit"
                    placeholder="Unit"
                    value={ingredient.unit}
                    onChange={(event) =>
                      updateIngredient(
                        ingredient.key,
                        "unit",
                        event.target.value,
                      )
                    }
                  />
                  <input
                    aria-label="Ingredient"
                    placeholder="Ingredient"
                    required
                    value={ingredient.title}
                    onChange={(event) =>
                      updateIngredient(
                        ingredient.key,
                        "title",
                        event.target.value,
                      )
                    }
                  />
                  <button
                    type="button"
                    className="recipe-editor__remove"
                    aria-label="Remove ingredient"
                    disabled={ingredients.length === 1}
                    onClick={() =>
                      setIngredients((current) =>
                        current.filter((item) => item.key !== ingredient.key),
                      )
                    }
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() =>
                setIngredients((current) => [
                  ...current,
                  initialIngredient(Date.now()),
                ])
              }
            >
              <Plus size={16} aria-hidden="true" /> Add ingredient
            </button>
          </fieldset>

          <fieldset>
            <legend>Steps</legend>
            <div className="recipe-editor__rows">
              {steps.map((step, index) => (
                <div
                  className="recipe-editor__row recipe-editor__row--step"
                  key={index}
                >
                  <span className="recipe-editor__step-number">
                    {index + 1}
                  </span>
                  <textarea
                    aria-label={`Step ${index + 1}`}
                    required
                    rows={2}
                    value={step}
                    onChange={(event) => updateStep(index, event.target.value)}
                  />
                  <button
                    type="button"
                    className="recipe-editor__remove"
                    aria-label="Remove step"
                    disabled={steps.length === 1}
                    onClick={() =>
                      setSteps((current) =>
                        current.filter((_, stepIndex) => stepIndex !== index),
                      )
                    }
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setSteps((current) => [...current, ""])}
            >
              <Plus size={16} aria-hidden="true" /> Add step
            </button>
          </fieldset>

          <label>
            Tags
            <input
              placeholder="quick, vegetarian, meal prep"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
            <small>Separate tags with commas.</small>
          </label>

          <div className="recipe-editor__actions">
            <Link className="button button--secondary" to="/recipes">
              Cancel
            </Link>
            <button
              className="button button--primary"
              type="submit"
              disabled={isSaving}
            >
              <Save size={17} aria-hidden="true" />{" "}
              {isSaving ? "Saving…" : "Save recipe"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

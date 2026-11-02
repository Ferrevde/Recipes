import { ArrowLeft, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  recipeCategories,
  recipeCategoryLabels,
  recipeDifficulties,
  recipeDifficultyLabels,
  type RecipeCategory,
  type RecipeDifficulty,
  type RecipeIngredient,
} from "../../shared/recipe";
import { ingredientSuggestions } from "../features/recipes/ingredientCatalog";
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
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  const [tags, setTags] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageImporting, setIsImageImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [focusedIngredientKey, setFocusedIngredientKey] = useState<
    number | null
  >(null);

  function applyRecipeInput(recipe: RecipeInput) {
    setTitle(recipe.title);
    setCategory(recipe.category);
    setDifficulty(recipe.difficulty);
    setPrepMinutes(String(recipe.prepMinutes));
    setCookMinutes(String(recipe.cookMinutes));
    setServings(String(recipe.servings));
    setSummary(recipe.summary);
    setIngredients(
      recipe.ingredients.map((ingredient, key) => ({
        amount: [ingredient.amount, ingredient.unit].filter(Boolean).join(" "),
        key,
        title: ingredient.title,
        unit: "",
      })),
    );
    setSteps(recipe.steps);
    setTags(recipe.tags.join(", "));
  }

  async function importFromWebsite() {
    if (!importUrl.trim()) return;
    setError(null);
    setIsImporting(true);
    try {
      applyRecipeInput(await recipesApi.importFromUrl(importUrl));
      setImportUrl("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Importeren mislukt.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function importFromImage() {
    if (!imageFile) return;
    setError(null);
    setIsImageImporting(true);
    try {
      applyRecipeInput(await recipesApi.importFromImage(imageFile));
      setImageFile(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Importeren mislukt.",
      );
    } finally {
      setIsImageImporting(false);
    }
  }

  useEffect(() => {
    if (!recipeId) {
      return;
    }
    void recipesApi
      .storedById(recipeId)
      .then((recipe) => {
        if (!recipe) {
          setError(
            "Alleen recepten in de gedeelde receptenverzameling kunnen worden bewerkt.",
          );
          return;
        }
        applyRecipeInput(recipe);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Het recept kon niet worden geladen.",
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

  function chooseIngredient(key: number, name: string) {
    updateIngredient(key, "title", name);
    setFocusedIngredientKey(null);
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
          ({ key: _key, title: ingredientTitle, amount }) => ({
            amount,
            title: ingredientTitle,
            unit: "",
          }),
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
        reason instanceof Error
          ? reason.message
          : "Het recept kon niet worden opgeslagen.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="recipe-editor">
      <Link className="back-link" to="/recipes">
        <ArrowLeft size={18} aria-hidden="true" />
        Alle recepten
      </Link>
      <PageHeader
        eyebrow="Jouw verzameling"
        title={isEditing ? "Recept bewerken" : "Recept toevoegen"}
        description={
          isEditing
            ? "Werk dit recept bij in je gedeelde receptenverzameling."
            : "Sla een recept op in je gedeelde receptenverzameling."
        }
      />

      {isLoading && <p className="loading-state">Recept laden…</p>}
      {!isLoading && (
        <form className="recipe-editor__form" onSubmit={submit}>
          <div className="recipe-editor__import">
            <label htmlFor="recipe-source-url">
              Recept importeren van een openbare webpagina
              <span className="recipe-editor__import-row">
                <input
                  id="recipe-source-url"
                  type="url"
                  placeholder="https://voorbeeld.nl/recept"
                  value={importUrl}
                  onChange={(event) => setImportUrl(event.target.value)}
                />
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={isImporting || importUrl.trim().length === 0}
                  onClick={() => void importFromWebsite()}
                >
                  {isImporting ? "Pagina lezen…" : "Importeer pagina"}
                </button>
              </span>
            </label>
            <small>
              Alleen openbare pagina’s met gestructureerde receptgegevens
              werken. Loginpagina’s worden niet omzeild.
            </small>
            <div className="recipe-editor__image-import">
              <label htmlFor="recipe-screenshot">
                Of importeer een screenshot
                <input
                  id="recipe-screenshot"
                  accept="image/*"
                  type="file"
                  onChange={(event) =>
                    setImageFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <button
                className="button button--secondary"
                type="button"
                disabled={isImageImporting || imageFile === null}
                onClick={() => void importFromImage()}
              >
                {isImageImporting
                  ? "Screenshot lezen…"
                  : "Importeer screenshot"}
              </button>
            </div>
          </div>
          {error && <p className="alert alert--error">{error}</p>}

          <div className="recipe-editor__grid">
            <label>
              Naam van het recept
              <input
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Categorie
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
              Moeilijkheid
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as RecipeDifficulty)
                }
              >
                {recipeDifficulties.map((item) => (
                  <option key={item} value={item}>
                    {recipeDifficultyLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Porties
              <input
                required
                min="1"
                type="number"
                value={servings}
                onChange={(event) => setServings(event.target.value)}
              />
            </label>
            <label>
              Voorbereiding (minuten)
              <input
                required
                min="0"
                type="number"
                value={prepMinutes}
                onChange={(event) => setPrepMinutes(event.target.value)}
              />
            </label>
            <label>
              Bereiding (minuten)
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
            Korte beschrijving
            <textarea
              required
              maxLength={300}
              rows={3}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>

          <fieldset>
            <legend>Ingrediënten</legend>
            <div className="recipe-editor__rows">
              {ingredients.map((ingredient) => (
                <div className="recipe-editor__row" key={ingredient.key}>
                  <input
                    aria-label="Hoeveelheid"
                    placeholder="Bijv. 2 stuks"
                    value={ingredient.amount}
                    onChange={(event) =>
                      updateIngredient(
                        ingredient.key,
                        "amount",
                        event.target.value,
                      )
                    }
                  />
                  <div className="recipe-editor__ingredient-field">
                    <input
                      aria-label="Ingrediënt"
                      autoComplete="off"
                      placeholder="Ingrediënt"
                      required
                      value={ingredient.title}
                      onBlur={() =>
                        window.setTimeout(
                          () => setFocusedIngredientKey(null),
                          150,
                        )
                      }
                      onChange={(event) => {
                        updateIngredient(
                          ingredient.key,
                          "title",
                          event.target.value,
                        );
                        setFocusedIngredientKey(ingredient.key);
                      }}
                      onFocus={() => setFocusedIngredientKey(ingredient.key)}
                    />
                    {focusedIngredientKey === ingredient.key &&
                      ingredientSuggestions(ingredient.title).length > 0 && (
                        <div
                          className="recipe-editor__suggestions"
                          role="listbox"
                          aria-label="Ingrediëntsuggesties"
                        >
                          {ingredientSuggestions(ingredient.title).map(
                            (suggestion) => (
                              <button
                                type="button"
                                role="option"
                                key={suggestion.name}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() =>
                                  chooseIngredient(
                                    ingredient.key,
                                    suggestion.name,
                                  )
                                }
                              >
                                {suggestion.name}
                              </button>
                            ),
                          )}
                        </div>
                      )}
                  </div>
                  <button
                    type="button"
                    className="recipe-editor__remove"
                    aria-label="Ingrediënt verwijderen"
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
              <Plus size={16} aria-hidden="true" /> Ingrediënt toevoegen
            </button>
          </fieldset>

          <fieldset>
            <legend>Stappen</legend>
            <div className="recipe-editor__rows">
              {steps.map((step, index) => (
                <div
                  className={`recipe-editor__row recipe-editor__row--step${
                    draggedStepIndex === index ? " is-dragging" : ""
                  }`}
                  key={index}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (
                      draggedStepIndex === null ||
                      draggedStepIndex === index
                    ) {
                      return;
                    }
                    setSteps((current) => {
                      const next = [...current];
                      const [moved] = next.splice(draggedStepIndex, 1);
                      if (moved !== undefined) next.splice(index, 0, moved);
                      return next;
                    });
                    setDraggedStepIndex(null);
                  }}
                >
                  <span
                    className="recipe-editor__step-drag"
                    draggable
                    aria-label={`Stap ${index + 1} verslepen`}
                    title="Stap verslepen"
                    onDragStart={() => setDraggedStepIndex(index)}
                    onDragEnd={() => setDraggedStepIndex(null)}
                  >
                    <GripVertical size={17} aria-hidden="true" />
                  </span>
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
                    aria-label="Stap verwijderen"
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
              <Plus size={16} aria-hidden="true" /> Stap toevoegen
            </button>
          </fieldset>

          <label>
            Tags
            <input
              placeholder="quick, vegetarian, meal prep"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
            <small>Scheid tags met komma's.</small>
          </label>

          <div className="recipe-editor__actions">
            <Link className="button button--secondary" to="/recipes">
              Annuleren
            </Link>
            <button
              className="button button--primary"
              type="submit"
              disabled={isSaving}
            >
              <Save size={17} aria-hidden="true" />{" "}
              {isSaving ? "Opslaan…" : "Recept opslaan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

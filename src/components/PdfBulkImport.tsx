import { FileUp } from "lucide-react";
import { useState } from "react";
import { canonicalizeIngredientTitle } from "../features/recipes/ingredientCatalog";
import {
  recipesApi,
  type PdfImportResult,
} from "../features/recipes/recipeApi";

export function PdfBulkImport() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<PdfImportResult[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function importFiles() {
    if (files.length === 0) {
      return;
    }
    setError(null);
    setResults([]);
    setIsImporting(true);
    try {
      const imported = await recipesApi.importFromPdfs(files);
      const saved: PdfImportResult[] = [];
      for (const result of imported) {
        if (!result.recipe) {
          saved.push(result);
          continue;
        }
        try {
          const normalizedRecipe = {
            ...result.recipe,
            ingredients: result.recipe.ingredients.map((ingredient) => ({
              ...ingredient,
              title: canonicalizeIngredientTitle(ingredient.title),
            })),
          };
          await recipesApi.create(normalizedRecipe);
          saved.push({ ...result, recipe: normalizedRecipe });
        } catch (reason) {
          saved.push({
            ...result,
            error:
              reason instanceof Error
                ? `Gelezen, maar opslaan mislukt: ${reason.message}`
                : "Gelezen, maar opslaan mislukt.",
          });
        }
      }
      setResults(saved);
      setFiles([]);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "PDF-importeren mislukt.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  const successCount = results.filter((result) => result.recipe).length;

  return (
    <section className="pdf-bulk-import" aria-labelledby="pdf-import-title">
      <div className="pdf-bulk-import__heading">
        <div>
          <p className="eyebrow">Beheer</p>
          <h2 id="pdf-import-title">Meerdere recepten uit PDF</h2>
          <p>
            Kies maximaal 20 PDF-bestanden. Elk bestand wordt als één recept
            gelezen en direct aan de receptenverzameling toegevoegd.
          </p>
        </div>
        <FileUp size={26} aria-hidden="true" />
      </div>

      <label className="pdf-bulk-import__picker">
        <span>PDF-bestanden kiezen</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={(event) => {
            setFiles(Array.from(event.target.files ?? []));
            setResults([]);
            setError(null);
          }}
        />
      </label>

      {files.length > 0 && (
        <p className="pdf-bulk-import__selection">
          {files.length} bestand{files.length === 1 ? "" : "en"} geselecteerd.
        </p>
      )}

      {error && <p className="alert alert--error">{error}</p>}

      <button
        className="button button--secondary"
        type="button"
        disabled={isImporting || files.length === 0}
        onClick={() => void importFiles()}
      >
        {isImporting ? "PDF-bestanden verwerken…" : "Importeer alle PDF's"}
      </button>

      {results.length > 0 && (
        <div className="pdf-bulk-import__results" aria-live="polite">
          <strong>
            {successCount} van {results.length} recepten opgeslagen.
          </strong>
          <ul>
            {results.map((result) => (
              <li key={result.filename}>
                <span>{result.filename}</span>
                <span className={result.recipe ? "is-success" : "is-error"}>
                  {result.recipe ? "Opgeslagen" : result.error}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

import type { Recipe } from "@shared/recipe";

export interface GeminiService {
  importFromUrl(url: string, apiKey: string): Promise<Omit<Recipe, "id">>;
  importFromImage(file: File, apiKey: string): Promise<Omit<Recipe, "id">>;
  importFromPdf(file: File, apiKey: string): Promise<Omit<Recipe, "id">>;
}

export function createGeminiService(): GeminiService {
  return {
    async importFromUrl(url, apiKey) {
      const { importRecipeFromUrl } = await import("../recipeImport");
      return importRecipeFromUrl(url, apiKey);
    },
    async importFromImage(file, apiKey) {
      const { importRecipeFromImage } = await import("../recipeImport");
      return importRecipeFromImage(file, apiKey);
    },
    async importFromPdf(file, apiKey) {
      const { importRecipeFromPdf } = await import("../recipeImport");
      return importRecipeFromPdf(file, apiKey);
    },
  };
}

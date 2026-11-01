# Contribution guide

## Principles

- Keep the app focused on browsing, searching, cooking, saving, and adding recipes.
- Prefer the simplest implementation that reduces complexity.
- Preserve the `recipesApi` data-source boundary; do not import the catalog from UI code.
- Keep shared contracts and explicit validators in `shared/`.
- Reuse centralized design tokens and existing components.
- Use strict TypeScript and avoid `any`.

## Validation

Before reporting work complete, run:

```bash
npm run check
```

For icon changes, regenerate assets with:

```bash
node scripts/gen-icons.mjs
```

## Adding recipe data

The built-in collection lives in `src/features/recipes/recipeCatalog.ts`. User-created recipes go through `RecipeEditorPage` and the Worker API into D1. Keep IDs stable for built-in entries, use existing categories and difficulty values, and preserve the `Recipe` contract.

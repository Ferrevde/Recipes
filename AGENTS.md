# Contribution guide

## Principles

- Keep the app focused on browsing, searching, cooking, and saving recipes.
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

Add validated entries in `src/features/recipes/recipeCatalog.ts`. Keep IDs stable, use one of the existing categories and difficulty values, and preserve the `Recipe` contract.

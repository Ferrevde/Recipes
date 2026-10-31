# Recipe Book

A focused recipe collection built with React, TypeScript, Vite, React Router, and plain CSS. The interface follows the dark, token-driven visual language of [Fitness-Hub](https://github.com/Ferrevde/Fitness-Hub), with a recipe-specific domain layer.

## Features

- Dashboard with featured recipes and collection stats
- Searchable and category-filtered recipe catalog
- Recipe details with ingredient checklist and cooking steps
- Saved recipes persisted in local storage
- Responsive sidebar and mobile navigation
- Installable PWA with generated recipe-book icons

## Development

```bash
npm install
npm run dev
```

Run the full quality gate before committing:

```bash
npm run check
```

## Data model

The catalog is intentionally static. UI code talks to `recipesApi`, so a future HTTP or Cloudflare Worker/D1 implementation can replace the source without changing page components. Boundary contracts and validation live in `shared/recipe.ts`.

## Project structure

- `src/app` — routing, navigation, and application shell
- `src/components` — reusable presentation components
- `src/features/recipes` — recipe catalog, formatting, and recipe UI
- `src/pages` — route-level composition
- `src/styles` — shared tokens and styles
- `shared` — domain contracts and validators
- `public` — favicon and PWA assets

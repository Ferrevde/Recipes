# Recipe Book

A focused recipe collection built with React, TypeScript, Vite, React Router, and plain CSS. The interface follows the dark, token-driven visual language of [Fitness-Hub](https://github.com/Ferrevde/Fitness-Hub), with a recipe-specific domain layer.

**Live app:** [recipes-9nv.pages.dev](https://recipes-9nv.pages.dev/)

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

The editor is available from the **Add** button. It sends validated recipes to the deployed Worker and D1 database.

Run the full quality gate before committing:

```bash
npm run check
```

## Data model

The built-in catalog remains available as a curated baseline, while user-created recipes are stored in Cloudflare D1 through the Worker API. UI code talks only to `recipesApi`, so the data source stays replaceable. Boundary contracts and validation live in `shared/recipe.ts`.

## Project structure

- `src/app` — routing, navigation, and application shell
- `src/components` — reusable presentation components
- `src/features/recipes` — recipe catalog, formatting, and recipe UI
- `src/pages` — route-level composition
- `src/styles` — shared tokens and styles
- `shared` — domain contracts and validators
- `public` — favicon and PWA assets

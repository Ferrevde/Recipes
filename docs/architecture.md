# Architecture

Recipe Book is a frontend-only Vite application. The architecture mirrors Fitness-Hub while keeping the recipe domain deliberately small.

## Runtime layers

1. `src/main.tsx` loads the application and global styles.
2. `src/App.tsx` maps URLs to page components with React Router.
3. `src/app/AppShell.tsx` provides persistent navigation and the page frame.
4. `src/pages` composes route-specific views.
5. `src/features/recipes` owns recipe presentation, formatting, and the data boundary.
6. `shared/recipe.ts` defines the contract and explicit validation used at the boundary.

## Data boundary

`recipesApi` reads the curated in-memory catalog and, when configured, merges user-created recipes from the Cloudflare Worker API. Components never import the catalog directly. The Worker validates requests at the boundary and stores user recipes in D1.

Favorites are a client-only preference stored under `recipes.savedIds` through `useLocalStorage`. New recipes are created at `/recipes/new` and persisted through `POST /api/recipes`.

## Styling

Design tokens are centralized in `src/styles/tokens.css`. Shared Fitness-Hub-inspired component patterns live in `components.css`; recipe-specific layout and states live in `recipes.css`. Pages should consume existing tokens rather than introduce independent visual systems.

## Quality gates

`npm run check` runs formatting, linting, strict TypeScript checks for both app and Worker, tests, and the production build. Worker deployment uses `npx wrangler deploy`; remote D1 migrations use `npm run d1:migrate:remote`.

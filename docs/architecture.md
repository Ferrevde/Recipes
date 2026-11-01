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

`recipesApi` leest de vaste catalogus en voegt lokaal opgeslagen recepten toe. Componenten importeren de catalogus nooit rechtstreeks. Gemini wordt rechtstreeks vanuit de browser aangeroepen voor screenshot-import.

Favorieten en zelfgemaakte recepten zijn lokale browservoorkeuren. Nieuwe recepten worden aangemaakt op `/recipes/new` en opgeslagen in `localStorage`.

## Styling

Design tokens are centralized in `src/styles/tokens.css`. Shared Fitness-Hub-inspired component patterns live in `components.css`; recipe-specific layout and states live in `recipes.css`. Pages should consume existing tokens rather than introduce independent visual systems.

## Quality gates

`npm run check` voert formattering, linting, strikte TypeScript-controles, tests en de productie-build uit.

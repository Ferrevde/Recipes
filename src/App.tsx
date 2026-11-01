import { Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { CategoriesPage } from "./pages/CategoriesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { RecipeEditorPage } from "./pages/RecipeEditorPage";
import { RecipesPage } from "./pages/RecipesPage";
import { SavedPage } from "./pages/SavedPage";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="recipes/new" element={<RecipeEditorPage />} />
        <Route path="recipes/:recipeId" element={<RecipeDetailPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="saved" element={<SavedPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;

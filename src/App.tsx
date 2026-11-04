import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { RecipeEditorPage } from "./pages/RecipeEditorPage";
import { RecipesPage } from "./pages/RecipesPage";
import { SavedPage } from "./pages/SavedPage";
import { WeekMenuPage } from "./pages/WeekMenuPage";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/recipes" replace />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route
          path="recipes/new"
          element={<Navigate to="/admin/recipes/new" replace />}
        />
        <Route path="recipes/:recipeId/edit" element={<RecipeEditorPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route
          path="admin"
          element={<Navigate to="/admin/recipes/new" replace />}
        />
        <Route path="admin/recipes/new" element={<RecipeEditorPage />} />
        <Route
          path="admin/recipes/:recipeId/edit"
          element={<RecipeEditorPage />}
        />
        <Route path="recipes/:recipeId" element={<RecipeDetailPage />} />
        <Route path="saved" element={<SavedPage />} />
        <Route path="weekmenu" element={<WeekMenuPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;

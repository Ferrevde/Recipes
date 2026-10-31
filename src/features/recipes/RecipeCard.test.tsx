import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { LucideIcon } from "lucide-react";
import { RecipeCard } from "./RecipeCard";
import type { Recipe } from "../../../shared/recipe";

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "test-recipe",
    title: "Test Recipe",
    category: "dinner",
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 2,
    difficulty: "Medium",
    summary: "A quick, delicious test recipe.",
    ingredients: [{ title: "Onion", amount: "1", unit: "" }],
    steps: ["Step one.", "Step two."],
    tags: ["quick", "easy"],
    ...overrides,
  };
}

function stubIcon(): LucideIcon {
  const Icon = (props: { size?: number; strokeWidth?: number }) => (
    <svg data-testid="icon" {...props} />
  );
  return Icon as unknown as LucideIcon;
}

function renderCard(
  recipe: Recipe,
  isFavorite = false,
  onToggleFavorite = vi.fn(),
  onOpen = vi.fn(),
) {
  render(
    <RecipeCard
      recipe={recipe}
      icon={stubIcon()}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onOpen={onOpen}
    />,
  );
}

describe("RecipeCard", () => {
  it("shows the category, time, and servings", () => {
    renderCard(makeRecipe());
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("25 min")).toBeInTheDocument();
    expect(screen.getByText("2 serves")).toBeInTheDocument();
  });

  it("invokes the open handler when the body is clicked", () => {
    const onOpen = vi.fn();
    renderCard(makeRecipe(), false, vi.fn(), onOpen);
    screen.getByRole("heading", { name: "Test Recipe" }).parentElement?.click();
    expect(onOpen).toHaveBeenCalledWith("test-recipe");
  });

  it("toggles the favorite state without navigating", () => {
    const onToggleFavorite = vi.fn();
    renderCard(makeRecipe(), false, onToggleFavorite);
    screen.getByRole("button", { name: /save recipe/i }).click();
    expect(onToggleFavorite).toHaveBeenCalledWith("test-recipe");
    expect(
      screen.getByRole("button", { name: /save recipe/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("limits the visible tags to three", () => {
    renderCard(makeRecipe({ tags: ["a", "b", "c", "d"] }));
    const tagSpans = document.querySelectorAll("span.recipe-tag");
    expect(tagSpans).toHaveLength(3);
  });
});

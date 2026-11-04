import { describe, expect, it } from "vitest";
import {
  formatIngredientAmount,
  ingredientSuggestions,
  pluralizeIngredient,
} from "./ingredientCatalog";

describe("ingredientCatalog", () => {
  it("geeft suggesties op basis van de getypte tekst", () => {
    expect(ingredientSuggestions("toma").map((item) => item.name)).toContain(
      "tomaat",
    );
  });

  it("gebruikt het enkelvoud voor één stuk", () => {
    expect(formatIngredientAmount("1 stuk", "", "tomaat")).toBe(
      "1 stuk tomaat",
    );
  });

  it("gebruikt het meervoud voor meerdere stuks", () => {
    expect(formatIngredientAmount("2 stuks", "", "tomaat")).toBe(
      "2 stuks tomaten",
    );
  });

  it("behoudt massawoorden", () => {
    expect(pluralizeIngredient("olijfolie", "2 el")).toBe("olijfolie");
    expect(pluralizeIngredient("rucola", "2 handjes")).toBe("rucola");
    expect(pluralizeIngredient("tonijn", "2 blikjes")).toBe("tonijn");
  });

  it("gebruikt Nederlandse uitzonderingen", () => {
    expect(pluralizeIngredient("kerstomaat", "2 stuks")).toBe("kerstomaten");
    expect(pluralizeIngredient("dunne lende", "2 stuks")).toBe("dunne lende");
    expect(pluralizeIngredient("kalkoenfilet", "2 stuks")).toBe("kalkoenfilet");
  });
});

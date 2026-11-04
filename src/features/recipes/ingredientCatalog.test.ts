import { describe, expect, it } from "vitest";
import {
  canonicalizeIngredientTitle,
  formatIngredientAmount,
  ingredientSuggestions,
  pluralizeIngredient,
} from "./ingredientCatalog";

describe("ingredientCatalog", () => {
  it("geeft suggesties op basis van de getypte tekst", () => {
    expect(ingredientSuggestions("toma").map((item) => item.name)).toContain(
      "tomaat",
    );
    expect(ingredientSuggestions("pen").map((item) => item.name)).toContain(
      "penne",
    );
    expect(
      ingredientSuggestions("geraspte kaas").map((item) => item.name),
    ).toContain("geraspte kaas");
  });

  it("normaliseert geïmporteerde varianten naar de catalogus", () => {
    expect(canonicalizeIngredientTitle("parmesan")).toBe("parmezaanse kaas");
    expect(canonicalizeIngredientTitle("kerstomaten")).toBe("kerstomaat");
    expect(canonicalizeIngredientTitle("geraspte kaas")).toBe("geraspte kaas");
    expect(canonicalizeIngredientTitle("dunne lende, in stukken")).toBe(
      "dunne lende, in stukken",
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
    expect(pluralizeIngredient("fazantfilet", "2 stuks")).toBe("fazantfilet");
  });
});

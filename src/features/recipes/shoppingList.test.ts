import { describe, expect, it } from "vitest";
import type { Recipe } from "../../../shared/recipe";
import { createShoppingList, shoppingItemLabel } from "./shoppingList";

const recipe = (ingredients: Recipe["ingredients"]): Recipe => ({
  category: "dinner",
  cookMinutes: 10,
  difficulty: "Easy",
  id: "recipe",
  ingredients,
  prepMinutes: 5,
  servings: 2,
  steps: ["Klaar."],
  summary: "",
  tags: [],
  title: "Testrecept",
});

describe("createShoppingList", () => {
  it("voegt gelijke ingrediënten samen", () => {
    const list = createShoppingList([
      recipe([{ amount: "2", title: "ui", unit: "stuks" }]),
      recipe([{ amount: "1", title: "ui", unit: "stuks" }]),
    ]);

    expect(list).toEqual([{ amount: "3", title: "ui", unit: "stuks" }]);
  });

  it("rondt gebroken totale hoeveelheden naar boven af", () => {
    const list = createShoppingList([
      recipe([{ amount: "½", title: "ei", unit: "" }]),
      recipe([{ amount: "1", title: "ei", unit: "" }]),
    ]);

    expect(list[0]).toEqual({ amount: "2", title: "ei", unit: "" });
    expect(shoppingItemLabel(list[0]!)).toBe("2 eieren");
  });

  it("voegt geen automatisch en toe aan onbekende ingrediënten", () => {
    const list = createShoppingList([
      recipe([{ amount: "2", title: "kalkoenfilet", unit: "" }]),
    ]);

    expect(shoppingItemLabel(list[0]!)).toBe("2 kalkoenfilet");
  });

  it("behoudt niet-numerieke hoeveelheden", () => {
    const list = createShoppingList([
      recipe([{ amount: "naar smaak", title: "zout", unit: "" }]),
    ]);

    expect(list).toEqual([{ amount: "naar smaak", title: "zout", unit: "" }]);
  });
});

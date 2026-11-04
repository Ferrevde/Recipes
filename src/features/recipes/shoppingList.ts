import type { Recipe } from "../../../shared/recipe";
import { formatIngredientAmount } from "./ingredientCatalog";

export interface ShoppingItem {
  title: string;
  amount: string;
  unit: string;
}

interface ParsedAmount {
  value: number;
  suffix: string;
}

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

function parseAmount(amount: string): ParsedAmount | null {
  const input = amount.trim();
  const mixed = /^(\d+)\s+(\d+)\s*\/\s*(\d+)(.*)$/.exec(input);
  if (mixed && Number(mixed[3] ?? 0) > 0) {
    const whole = Number(mixed[1] ?? 0);
    const numerator = Number(mixed[2] ?? 0);
    const denominator = Number(mixed[3] ?? 1);
    return {
      value: whole + numerator / denominator,
      suffix: (mixed[4] ?? "").trim(),
    };
  }

  const fraction = /^(\d+)\s*\/\s*(\d+)(.*)$/.exec(input);
  if (fraction && Number(fraction[2] ?? 0) > 0) {
    return {
      value: Number(fraction[1] ?? 0) / Number(fraction[2] ?? 1),
      suffix: (fraction[3] ?? "").trim(),
    };
  }

  const decimal = /^(\d+(?:[.,]\d+)?)(.*)$/.exec(input);
  if (decimal) {
    const numeric = decimal[1] ?? "0";
    const remainder = decimal[2] ?? "";
    const trailingFraction = UNICODE_FRACTIONS[remainder.charAt(0)];
    return {
      value: Number(numeric.replace(",", ".")) + (trailingFraction ?? 0),
      suffix: (trailingFraction ? remainder.slice(1) : remainder).trim(),
    };
  }

  const unicode = UNICODE_FRACTIONS[input.charAt(0)];
  return unicode === undefined
    ? null
    : { value: unicode, suffix: input.slice(1).trim() };
}

function formatWhole(value: number): string {
  return String(Math.ceil(value));
}

export function createShoppingList(recipes: Recipe[]): ShoppingItem[] {
  const numeric = new Map<
    string,
    { title: string; unit: string; total: number }
  >();
  const text = new Map<string, ShoppingItem>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const parsed = parseAmount(ingredient.amount);
      const suffix = parsed?.suffix ?? "";
      const unit = [ingredient.unit.trim(), suffix].filter(Boolean).join(" ");
      const key = `${ingredient.title.trim().toLocaleLowerCase("nl")}::${unit.toLocaleLowerCase("nl")}`;

      if (parsed) {
        const current = numeric.get(key);
        numeric.set(key, {
          title: ingredient.title,
          unit,
          total: (current?.total ?? 0) + parsed.value,
        });
      } else if (!text.has(key)) {
        text.set(key, {
          amount: ingredient.amount,
          title: ingredient.title,
          unit: ingredient.unit,
        });
      }
    }
  }

  return [
    ...[...numeric.values()].map((item) => ({
      amount: formatWhole(item.total),
      title: item.title,
      unit: item.unit,
    })),
    ...text.values(),
  ].sort((left, right) => left.title.localeCompare(right.title, "nl"));
}

export function shoppingItemLabel(item: ShoppingItem): string {
  return formatIngredientAmount(item.amount, item.unit, item.title);
}

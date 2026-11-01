export interface CommonIngredient {
  name: string;
  plural: string;
}

// Veelgebruikte ingrediënten voor de snelle suggestielijst in de editor.
export const commonIngredients: CommonIngredient[] = [
  { name: "aardappel", plural: "aardappelen" },
  { name: "avocado", plural: "avocado's" },
  { name: "basilicum", plural: "basilicum" },
  { name: "bloem", plural: "bloem" },
  { name: "boter", plural: "boter" },
  { name: "bosui", plural: "bosuitjes" },
  { name: "broccoli", plural: "broccoli's" },
  { name: "champignon", plural: "champignons" },
  { name: "citroen", plural: "citroenen" },
  { name: "courgette", plural: "courgettes" },
  { name: "dille", plural: "dille" },
  { name: "ei", plural: "eieren" },
  { name: "erwt", plural: "erwten" },
  { name: "feta", plural: "feta" },
  { name: "gember", plural: "gember" },
  { name: "gehakt", plural: "gehakt" },
  { name: "garnaal", plural: "garnalen" },
  { name: "knoflook", plural: "knoflook" },
  { name: "knoflookteen", plural: "knoflooktenen" },
  { name: "komkommer", plural: "komkommers" },
  { name: "koriander", plural: "koriander" },
  { name: "kikkererwt", plural: "kikkererwten" },
  { name: "melk", plural: "melk" },
  { name: "mozzarella", plural: "mozzarella" },
  { name: "mosterd", plural: "mosterd" },
  { name: "olijfolie", plural: "olijfolie" },
  { name: "ui", plural: "uien" },
  { name: "paprika", plural: "paprika's" },
  { name: "parmezaanse kaas", plural: "parmezaanse kaas" },
  { name: "pasta", plural: "pasta" },
  { name: "peterselie", plural: "peterselie" },
  { name: "pindakaas", plural: "pindakaas" },
  { name: "prei", plural: "preien" },
  { name: "rijst", plural: "rijst" },
  { name: "room", plural: "room" },
  { name: "rode peper", plural: "rode pepers" },
  { name: "rozijn", plural: "rozijnen" },
  { name: "sardine", plural: "sardines" },
  { name: "spinazie", plural: "spinazie" },
  { name: "spaghetti", plural: "spaghetti" },
  { name: "tomaat", plural: "tomaten" },
  { name: "tonijn", plural: "tonijnen" },
  { name: "vanille-ijs", plural: "vanille-ijs" },
  { name: "varkensvlees", plural: "varkensvlees" },
  { name: "vis", plural: "vissen" },
  { name: "walnoot", plural: "walnoten" },
  { name: "zalm", plural: "zalmen" },
  { name: "zout", plural: "zout" },
  { name: "zwarte peper", plural: "zwarte peper" },
];

export function ingredientSuggestions(query: string): CommonIngredient[] {
  const normalized = query.trim().toLocaleLowerCase("nl");
  if (!normalized) {
    return [];
  }
  return commonIngredients
    .filter((ingredient) => ingredient.name.includes(normalized))
    .slice(0, 8);
}

function isSingleAmount(amount: string): boolean {
  return /^\s*1(?:[,.]0+)?(?:\s|$)/.test(amount);
}

function hasMultipleAmount(amount: string): boolean {
  const value = Number.parseFloat(amount.trim().replace(",", "."));
  return Number.isFinite(value) && value > 1;
}

export function pluralizeIngredient(title: string, amount: string): string {
  if (!hasMultipleAmount(amount) || isSingleAmount(amount)) {
    return title;
  }

  const commaIndex = title.indexOf(",");
  const base =
    commaIndex >= 0 ? title.slice(0, commaIndex).trim() : title.trim();
  const suffix = commaIndex >= 0 ? title.slice(commaIndex) : "";
  const normalized = base.toLocaleLowerCase("nl");
  const known = commonIngredients.find(
    (ingredient) => ingredient.name === normalized,
  );
  if (known?.plural === base || /(?:en|s)$/i.test(base)) {
    return title;
  }
  const plural = known?.plural ?? heuristicPlural(base);
  return `${plural}${suffix}`;
}

function heuristicPlural(word: string): string {
  if (/(s|x|z|ch|sh)$/i.test(word)) {
    return `${word}en`;
  }
  if (/(a|o|u|i|y)$/i.test(word)) {
    return `${word}'s`;
  }
  return `${word}en`;
}

export function formatIngredientAmount(
  amount: string,
  unit: string,
  title: string,
): string {
  const quantity = [amount.trim(), unit.trim()].filter(Boolean).join(" ");
  return [quantity, pluralizeIngredient(title, amount)]
    .filter(Boolean)
    .join(" ");
}

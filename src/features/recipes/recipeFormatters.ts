// Presentation formatting for recipes. These are pure functions so they can be
// unit-tested independently of the UI and the catalog.

export function formatTotalTime(recipe: {
  prepMinutes: number;
  cookMinutes: number;
}): string {
  const total = recipe.prepMinutes + recipe.cookMinutes;
  if (recipe.cookMinutes === 0) {
    return `${recipe.prepMinutes} min`;
  }
  return `${total} min`;
}

export function formatTimeParts(
  prepMinutes: number,
  cookMinutes: number,
): {
  prep: string;
  cook: string;
} {
  const prepLabel = prepMinutes > 0 ? `${prepMinutes} min prep` : "";
  const cookLabel = cookMinutes > 0 ? `${cookMinutes} min cook` : "no cook";
  return { prep: prepLabel, cook: cookLabel };
}

export function formatServings(servings: number, label = "serves"): string {
  return `${servings} ${label}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  const parts = [`${hours} hr`];
  if (remaining > 0) {
    parts.push(`${remaining} min`);
  }
  return parts.join(", ");
}

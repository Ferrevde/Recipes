export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
    ? email
    : null;
}

export function validatePassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 200;
}

const WEEKDAYS = new Set([
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag",
]);

export function validateWeekMenu(
  input: unknown,
): Record<string, string> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const result: Record<string, string> = {};
  for (const [day, recipeId] of Object.entries(input)) {
    if (!WEEKDAYS.has(day) || typeof recipeId !== "string") return null;
    if (recipeId.length > 200) return null;
    result[day] = recipeId;
  }
  return result;
}

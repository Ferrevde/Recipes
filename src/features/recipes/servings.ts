// Serving-size helpers. These are pure functions so the ingredient list can be
// rescaled in the UI and unit-tested without any component setup.

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

interface ParsedQuantity {
  value: number;
  length: number;
}

const DECIMAL_PATTERN = /^\d+(?:[.,]\d+)?/;
const FRACTION_PATTERN = /^(\d+)\s*\/\s*(\d+)/;
const MIXED_PATTERN = /^(\d+)\s+(\d+)\s*\/\s*(\d+)/;

function parseLeadingQuantity(text: string): ParsedQuantity | null {
  const input = text.trimStart();
  if (!input) {
    return null;
  }

  const mixed = MIXED_PATTERN.exec(input);
  if (mixed) {
    const denominator = Number(mixed[3]);
    if (denominator > 0) {
      return {
        value: Number(mixed[1]) + Number(mixed[2]) / denominator,
        length: mixed[0].length,
      };
    }
  }

  const fraction = FRACTION_PATTERN.exec(input);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator > 0) {
      return {
        value: Number(fraction[1]) / denominator,
        length: fraction[0].length,
      };
    }
  }

  const firstChar = input.charAt(0);
  const unicode = UNICODE_FRACTIONS[firstChar];
  if (unicode !== undefined) {
    return { value: unicode, length: 1 };
  }

  const decimal = DECIMAL_PATTERN.exec(input);
  if (decimal) {
    const value = Number(decimal[0].replace(",", "."));
    const trailingFraction =
      input.length > decimal[0].length
        ? UNICODE_FRACTIONS[input.charAt(decimal[0].length)]
        : undefined;
    if (trailingFraction !== undefined) {
      return {
        value: value + trailingFraction,
        length: decimal[0].length + 1,
      };
    }
    return { value, length: decimal[0].length };
  }

  return null;
}

function roundAmount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return value;
  }
  if (value >= 20) {
    return Math.round(value / 5) * 5;
  }
  if (value >= 10) {
    return Math.round(value);
  }
  if (value >= 2) {
    return Math.round(value * 2) / 2;
  }
  return Math.max(0.25, Math.round(value * 4) / 4);
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const text = rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return text.replace(".", ",");
}

/**
 * Scales the numeric part of an ingredient amount, leaving the rest of the
 * text (units, descriptive words) untouched.
 */
export function scaleAmount(amount: string, factor: number): string {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) {
    return amount;
  }

  const leading = parseLeadingQuantity(amount);
  if (!leading) {
    return amount;
  }

  const rest = amount.slice(leading.length);
  const scaled = roundAmount(leading.value * factor);
  const separator = rest && !/^[\s.,)]/.test(rest) ? " " : "";
  return `${formatNumber(scaled)}${separator}${rest}`.trimEnd();
}

export function factorForServings(
  targetServings: number,
  recipeServings: number,
): number {
  if (
    !Number.isFinite(targetServings) ||
    !Number.isFinite(recipeServings) ||
    recipeServings <= 0 ||
    targetServings <= 0
  ) {
    return 1;
  }
  return targetServings / recipeServings;
}

export function servingsLabel(servings: number): string {
  return `${servings} ${servings === 1 ? "persoon" : "personen"}`;
}

export const servingPresets = [2, 4, 6, 8] as const;

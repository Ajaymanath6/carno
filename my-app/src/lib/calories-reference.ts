import {
  REFERENCE_ALIASES_SORTED,
  REFERENCE_FOODS,
  type ReferenceFoodId,
} from "../data/reference-macros";

export type CalorieEngine = "vertex" | "reference" | "reference_then_vertex";

export type CalorieDaySource = "reference" | "vertex";

/** Fixed adult daily kcal need for intake ratio UI. */
export const DAILY_KCAL_NEED = 2500;

/** Input shape aligned with Prisma `FoodEntry` fields used for estimation. */
export type MealCalorieInput = {
  id: string;
  rawText: string;
  quantity: string | null;
  unit: string | null;
  foodNameNormalized: string;
};

export type DayCalorieSessionInput = {
  localDate: string;
  foodEntries: MealCalorieInput[];
};

export function resolveCalorieEngine(): CalorieEngine {
  const raw = process.env.CALORIE_ENGINE?.trim().toLowerCase();
  if (raw === "vertex" || raw === "reference" || raw === "reference_then_vertex") {
    return raw;
  }
  return "reference_then_vertex";
}

export function calorieEngineUsesReference(engine: CalorieEngine): boolean {
  return engine === "reference" || engine === "reference_then_vertex";
}

export function calorieEngineUsesVertex(engine: CalorieEngine): boolean {
  return engine === "vertex" || engine === "reference_then_vertex";
}

const OZ_TO_G = 28.349523125;
const LB_TO_G = 453.59237;

function parseFloatLoose(s: string): number | null {
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Derive edible portion in grams from structured fields and optional raw text heuristics.
 */
export function parseGramsFromMeal(input: {
  rawText: string;
  quantity: string | null;
  unit: string | null;
}): number | null {
  const unitNorm = input.unit?.trim().toLowerCase() ?? "";
  const qtyStr = input.quantity?.trim() ?? "";

  const qtyNum = qtyStr ? parseFloatLoose(qtyStr) : null;

  if (qtyNum != null && qtyNum > 0 && unitNorm) {
    if (/^(g|gram|grams)$/.test(unitNorm)) return qtyNum;
    if (unitNorm === "gm") return qtyNum;
    if (/^(kg|kilogram|kilograms)$/.test(unitNorm)) return qtyNum * 1000;
    if (/^(oz|ounce|ounces)$/.test(unitNorm)) return qtyNum * OZ_TO_G;
    if (/^(lb|lbs|pound|pounds)$/.test(unitNorm)) return qtyNum * LB_TO_G;
    if (/^(ml|milliliters?)$/.test(unitNorm)) return qtyNum;
    if (/^(l|liter|liters|litre|litres)$/.test(unitNorm)) return qtyNum * 1000;
    if (/^(egg|eggs)$/.test(unitNorm)) {
      const perEgg = REFERENCE_FOODS.egg.gramsPerEgg ?? 50;
      return qtyNum * perEgg;
    }
  }

  const text = `${input.rawText} ${qtyStr} ${unitNorm}`.trim();
  const eggMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:large\s+)?eggs?\b/i);
  if (eggMatch) {
    const n = parseFloatLoose(eggMatch[1]);
    if (n != null && n > 0) {
      const perEgg = REFERENCE_FOODS.egg.gramsPerEgg ?? 50;
      return n * perEgg;
    }
  }

  const massMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(g|grams?|kg|oz|lbs?|lb|ml|mL)\b/i);
  if (massMatch) {
    const n = parseFloatLoose(massMatch[1]);
    const u = massMatch[2].toLowerCase();
    if (n != null && n > 0) {
      if (u === "kg") return n * 1000;
      if (u === "oz") return n * OZ_TO_G;
      if (u === "lb" || u === "lbs") return n * LB_TO_G;
      if (u === "ml") return n;
      return n;
    }
  }

  return null;
}

/** Match longest alias in normalized haystack. */
export function resolveReferenceFoodId(haystack: string): ReferenceFoodId | null {
  const s = haystack.toLowerCase().trim();
  if (!s) return null;
  for (const { alias, id } of REFERENCE_ALIASES_SORTED) {
    if (s.includes(alias)) {
      return id;
    }
  }
  return null;
}

export function estimateMealKcalReference(entry: MealCalorieInput): number | null {
  const grams = parseGramsFromMeal({
    rawText: entry.rawText,
    quantity: entry.quantity,
    unit: entry.unit,
  });
  const combinedHaystack = `${entry.foodNameNormalized} ${entry.rawText}`;
  const foodId = resolveReferenceFoodId(combinedHaystack);
  if (!foodId) {
    return null;
  }

  const gramsFallback =
    grams == null ?
      (() => {
        const m = entry.rawText.trim().match(/^(\d+(?:\.\d+)?)\b/);
        const n = m?.[1] ? parseFloatLoose(m[1]) : null;
        // If the user started the message with a number and we recognize the food,
        // treat it as grams (common quick-log convention).
        if (n != null && n >= 5 && n <= 2000) {
          return n;
        }
        return null;
      })()
    : grams;

  if (gramsFallback == null || gramsFallback <= 0) {
    return null;
  }
  const meta = REFERENCE_FOODS[foodId];
  return Math.max(0, Math.round((gramsFallback * meta.kcalPer100g) / 100));
}

/**
 * Per-meal reference kcal and per-day sum only when every meal with food logged gets a reference estimate.
 */
export function rollupReferenceCaloriesForDays(days: DayCalorieSessionInput[]): {
  kcalByDate: Map<string, number>;
  sourceByDate: Map<string, CalorieDaySource>;
} {
  const kcalByDate = new Map<string, number>();
  const sourceByDate = new Map<string, CalorieDaySource>();

  for (const day of days) {
    let sum = 0;
    let complete = true;
    for (const m of day.foodEntries) {
      const k = estimateMealKcalReference(m);
      if (k == null) {
        complete = false;
      } else {
        sum += k;
      }
    }
    if (day.foodEntries.length === 0) {
      kcalByDate.set(day.localDate, 0);
      sourceByDate.set(day.localDate, "reference");
    } else if (complete) {
      kcalByDate.set(day.localDate, sum);
      sourceByDate.set(day.localDate, "reference");
    }
  }

  return { kcalByDate, sourceByDate };
}

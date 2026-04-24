import {
  MEAL_QUICK_BROWN_EGGS,
  MEAL_QUICK_CHICKEN,
  MEAL_QUICK_MUTTON,
  MEAL_QUICK_PANEER,
  MEAL_QUICK_RED_MEAT,
} from "@/lib/brand";

/**
 * Maps normalized food label (from logging) to a quick-pick PNG path when it reads
 * like one of the known categories; otherwise null (no inline thumb in chat).
 */
export function mealThumbPathForNormalizedFood(normalized: string): string | null {
  const s = normalized.toLowerCase().trim();
  if (!s) {
    return null;
  }
  if (s.includes("chicken")) {
    return MEAL_QUICK_CHICKEN;
  }
  if (s.includes("mutton")) {
    return MEAL_QUICK_MUTTON;
  }
  if (s.includes("paneer")) {
    return MEAL_QUICK_PANEER;
  }
  if (s.includes("red meat") || s.includes("beef") || s.includes("steak")) {
    return MEAL_QUICK_RED_MEAT;
  }
  if (s.includes("egg")) {
    return MEAL_QUICK_BROWN_EGGS;
  }
  return null;
}

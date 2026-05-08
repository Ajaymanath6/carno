import {
  MEAL_QUICK_APPLE,
  MEAL_QUICK_BANANA,
  MEAL_QUICK_BROWN_EGGS,
  MEAL_QUICK_CHICKEN,
  MEAL_QUICK_CUCUMBER,
  MEAL_QUICK_GHEE,
  MEAL_QUICK_MANGO,
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
  if (s.includes("ghee")) {
    return MEAL_QUICK_GHEE;
  }
  if (s.includes("egg")) {
    return MEAL_QUICK_BROWN_EGGS;
  }
  if (s.includes("banana")) {
    return MEAL_QUICK_BANANA;
  }
  if (s.includes("apple")) {
    return MEAL_QUICK_APPLE;
  }
  if (s.includes("mango")) {
    return MEAL_QUICK_MANGO;
  }
  if (s.includes("cucumber")) {
    return MEAL_QUICK_CUCUMBER;
  }
  if (s.includes("chicken") || s.includes("chiken")) {
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
  return null;
}

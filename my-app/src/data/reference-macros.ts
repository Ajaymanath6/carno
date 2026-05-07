/**
 * Reference energy density for calculator-style calories (not lab-accurate).
 * Values approximate USDA-style averages for cooked/common preparations unless noted.
 */

export type ReferenceFoodMeta = {
  /** Kilocalories per 100 g edible portion */
  kcalPer100g: number;
  /** When quantity is counted as eggs without explicit grams */
  gramsPerEgg?: number;
};

export const REFERENCE_FOODS = {
  chicken: { kcalPer100g: 165 },
  turkey: { kcalPer100g: 135 },
  duck: { kcalPer100g: 240 },
  beef: { kcalPer100g: 250 },
  lamb: { kcalPer100g: 265 },
  mutton: { kcalPer100g: 265 },
  pork: { kcalPer100g: 240 },
  bacon: { kcalPer100g: 541 },
  sausage: { kcalPer100g: 280 },
  fish: { kcalPer100g: 140 },
  salmon: { kcalPer100g: 208 },
  tuna: { kcalPer100g: 130 },
  shrimp: { kcalPer100g: 99 },
  egg: { kcalPer100g: 143, gramsPerEgg: 50 },
  paneer: { kcalPer100g: 265 },
  cheese: { kcalPer100g: 350 },
  butter: { kcalPer100g: 717 },
  ghee: { kcalPer100g: 900 },
  cream: { kcalPer100g: 340 },
  milk_whole: { kcalPer100g: 61 },
  yogurt: { kcalPer100g: 59 },
  bone_broth: { kcalPer100g: 15 },
  liver: { kcalPer100g: 165 },
  organ_meat: { kcalPer100g: 180 },
} as const satisfies Record<string, ReferenceFoodMeta>;

export type ReferenceFoodId = keyof typeof REFERENCE_FOODS;

/** Aliases (lowercase); matched longest-first against normalized food text. */
export const REFERENCE_ALIASES: ReadonlyArray<{ alias: string; id: ReferenceFoodId }> = [
  { alias: "red meat", id: "beef" },
  { alias: "steak", id: "beef" },
  { alias: "ground beef", id: "beef" },
  { alias: "beef", id: "beef" },
  { alias: "chiken", id: "chicken" },
  { alias: "chicken", id: "chicken" },
  { alias: "turkey", id: "turkey" },
  { alias: "duck", id: "duck" },
  { alias: "mutton", id: "mutton" },
  { alias: "lamb", id: "lamb" },
  { alias: "pork", id: "pork" },
  { alias: "bacon", id: "bacon" },
  { alias: "sausage", id: "sausage" },
  { alias: "salmon", id: "salmon" },
  { alias: "tuna", id: "tuna" },
  { alias: "shrimp", id: "shrimp" },
  { alias: "seafood", id: "fish" },
  { alias: "fish", id: "fish" },
  { alias: "eggs", id: "egg" },
  { alias: "egg", id: "egg" },
  { alias: "paneer", id: "paneer" },
  { alias: "cheese", id: "cheese" },
  { alias: "butter", id: "butter" },
  { alias: "ghee", id: "ghee" },
  { alias: "cream", id: "cream" },
  { alias: "milk", id: "milk_whole" },
  { alias: "yogurt", id: "yogurt" },
  { alias: "broth", id: "bone_broth" },
  { alias: "liver", id: "liver" },
  { alias: "organ", id: "organ_meat" },
];

/** Longest alias first for deterministic greedy matching */
export const REFERENCE_ALIASES_SORTED = [...REFERENCE_ALIASES].sort(
  (a, b) => b.alias.length - a.alias.length,
);

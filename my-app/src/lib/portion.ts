export type ParsedPortion = {
  /** Numeric string as entered (e.g. "200", "0.25", "7") */
  quantity: string;
  /** Normalized unit string (e.g. "g", "kg", "oz", "lb", "eggs") */
  unit: string;
};

/**
 * Extract a basic portion from free text.
 *
 * Supported (case-insensitive):
 * - grams / kilograms: `200 g`, `200g`, `0.25 kg`
 * - ounces / pounds: `6 oz`, `1 lb`, `2lbs`
 * - eggs: `7 eggs`, `2 egg`
 * - tablespoons: `1 tbsp ghee`, `1 tablespoon ghee`
 *
 * Returns the first match (left-to-right). Does not attempt to parse multiple portions.
 */
export function parseBasicPortionFromText(text: string): ParsedPortion | null {
  const s = text.trim();
  if (!s) return null;

  // If user starts with a number and then a known food word, assume grams.
  // Examples: "550 beef", "200 chicken", "150 paneer".
  // This is a pragmatic UX choice: most users omit "g" when typing quick logs.
  const leading = s.match(
    /^\s*(\d+(?:\.\d+)?)\s+(beef|steak|chicken|turkey|duck|mutton|lamb|pork|bacon|sausage|fish|salmon|tuna|shrimp|paneer|cheese|butter|ghee|cream|liver)\b/i,
  );
  if (leading?.[1]) {
    return { quantity: leading[1], unit: "g" };
  }

  // Eggs (prefer explicit eggs before general unit parsing)
  const egg = s.match(/\b(\d+(?:\.\d+)?)\s*(?:large\s+)?eggs?\b/i);
  if (egg?.[1]) {
    return { quantity: egg[1], unit: "eggs" };
  }
  const pieces = s.match(
    /\b(\d+(?:\.\d+)?)\s*(apples?|bananas?|mango(?:es|s)?|cucumbers?)\b/i,
  );
  if (pieces?.[1] && pieces[2]) {
    const raw = pieces[2].toLowerCase();
    const unit =
      raw.startsWith("apple")
        ? "apple"
        : raw.startsWith("banana")
          ? "banana"
          : raw.startsWith("mango")
            ? "mango"
            : "cucumber";
    return { quantity: pieces[1], unit };
  }

  const unit = s.match(
    /\b(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|gm|grams?|oz|ounces?|lb|lbs|pounds?|tbsp|tablespoons?)\b/i,
  );
  if (unit?.[1] && unit[2]) {
    const rawUnit = unit[2].toLowerCase();
    const normalized =
      rawUnit.startsWith("kg") ? "kg"
      : rawUnit === "gm" || rawUnit.startsWith("g") ? "g"
      : rawUnit.startsWith("oz") ? "oz"
      : rawUnit === "lb" || rawUnit === "lbs" || rawUnit.startsWith("pound") ? "lb"
      : rawUnit === "tbsp" || rawUnit.startsWith("tablespoon") ? "tbsp"
      : rawUnit;
    return { quantity: unit[1], unit: normalized };
  }

  return null;
}


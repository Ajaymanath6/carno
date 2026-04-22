/** Normalize free-text meal for fuzzy matching across days. */
export function normalizeFoodLabel(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 200);
}

/** Normalize free-text meal for fuzzy matching across days. */
export function normalizeFoodLabel(text: string): string {
  let s = text.trim().toLowerCase().replace(/\s+/g, " ");
  // Common typos so thumbs / category hints still match (e.g. "chiken" → chicken).
  s = s.replace(/\bchiken\b/g, "chicken");
  return s.slice(0, 200);
}

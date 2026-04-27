/** Normalize free-text meal for fuzzy matching across days. */
export function normalizeFoodLabel(text: string): string {
  let s = text.trim().toLowerCase().replace(/\s+/g, " ");
  // Common typos so thumbs / category hints still match (e.g. "chiken" → chicken).
  s = s.replace(/\bchiken\b/g, "chicken");
  return s.slice(0, 200);
}

/** Title-style label from the log line (first clause), for UI next to meal thumbs. */
export function displayFoodTitleFromLog(rawText: string, normalizedFallback: string): string {
  const line = rawText.trim().split(/[.,;]/)[0]?.trim() ?? "";
  const base = line.length > 0 ? line : normalizedFallback.trim();
  if (!base) {
    return "";
  }
  const lower = base.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

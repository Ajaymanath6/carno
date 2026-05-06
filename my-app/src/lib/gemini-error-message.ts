/**
 * Turns Gemini / Vertex SDK error strings into short user-facing copy when possible.
 */
export function friendlyGeminiQuotaMessage(raw: string): string {
  const lower = raw.toLowerCase();
  const studioQuota =
    lower.includes("resource_exhausted") ||
    lower.includes('"status":"resource_exhausted"') ||
    lower.includes("429") ||
    lower.includes("quota exceeded") ||
    lower.includes("free_tier") ||
    lower.includes("rate limit");

  if (!studioQuota) {
    return raw;
  }

  return (
    "Gemini hit a usage limit (Google AI Studio free tier is often ~5 requests/minute per model). " +
    "Wait about a minute and tap Regenerate, enable billing on your AI Studio / Cloud project for higher limits, " +
    "or route clinical summaries through Vertex: set AI_PROVIDER_PERIOD=vertex plus VERTEX_PROJECT_ID and WIF credentials " +
    "(see .env.example)."
  );
}

/**
 * Gemini often echoes the UI salutation ("Good morning, Name") inside the article body.
 * The chat shows greeting separately; strip repeated openings from the body.
 */
export function stripDuplicateGreetingPrefix(greetingLine: string, articleBody: string): string {
  const g = greetingLine.trim();
  let t = articleBody.trim();
  if (!g || !t) {
    return articleBody;
  }

  const lowerG = g.toLowerCase();
  let lowerT = t.toLowerCase();

  while (lowerT.startsWith(lowerG)) {
    t = t.slice(g.length).trimStart();
    t = t.replace(/^[,.\s:;—\-]+/, "").trimStart();
    lowerT = t.toLowerCase();
  }

  return t.trim() || articleBody.trim();
}

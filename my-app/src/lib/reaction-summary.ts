/** Snapshot stored on assistant message metadata after submitReaction (JSON-safe). */
export type ReactionSnapshot = {
  energyLevel: number | null;
  bloating: number | null;
  gas: number | null;
  stomachDiscomfort: number | null;
  mood: number | null;
  notes: string | null;
  ateYesterdaySame: boolean;
  feltDifferentNotes: string | null;
  symptomsBetterOrWorse: string | null;
};

/** One-line preview for the collapsed reaction row in chat. */
export function formatReactionShortSummary(r: ReactionSnapshot): string {
  const bits: string[] = [];
  if (r.energyLevel != null) {
    bits.push(`Energy ${r.energyLevel}/5`);
  }
  if (r.mood != null) {
    bits.push(`Mood ${r.mood}/5`);
  }
  if (r.bloating != null) {
    bits.push(`Bloating ${r.bloating}/5`);
  }
  const numeric = [r.energyLevel, r.bloating, r.gas, r.stomachDiscomfort, r.mood].filter(
    (x): x is number => x != null,
  );
  const avg =
    numeric.length > 0 ? numeric.reduce((a, b) => a + b, 0) / numeric.length : null;

  let line = bits.slice(0, 4).join(" · ");
  if (!line && avg != null) {
    line = `Average intensity ${avg.toFixed(1)}/5`;
  }
  if (!line) {
    line = "Check-in saved";
  }

  if (avg != null) {
    if (avg <= 2.2) {
      line += " — mostly mild.";
    } else if (avg >= 3.8) {
      line += " — stronger symptoms logged.";
    } else {
      line += " — mixed.";
    }
  }

  const noteTrim = r.notes?.trim();
  if (noteTrim) {
    const snip = noteTrim.length > 72 ? `${noteTrim.slice(0, 72)}…` : noteTrim;
    line += ` Notes: “${snip}”`;
  }

  return line;
}

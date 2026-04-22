import type { FoodEntry, ReactionEntry } from "@prisma/client";

export type DailySummaryPayload = {
  localDate: string;
  foods: Array<{
    rawText: string;
    loggedAt: string;
    followUpCompleted: boolean;
  }>;
  reactions: Array<{
    foodRaw: string;
    energyLevel: number | null;
    bloating: number | null;
    gas: number | null;
    stomachDiscomfort: number | null;
    mood: number | null;
    ateYesterdaySame: boolean | null;
    symptomsBetterOrWorse: string | null;
  }>;
};

export function buildDailySummaryPayload(
  localDate: string,
  entries: Array<
    FoodEntry & {
      reactions: ReactionEntry[];
    }
  >,
): DailySummaryPayload {
  return {
    localDate,
    foods: entries.map((e) => ({
      rawText: e.rawText,
      loggedAt: e.loggedAt.toISOString(),
      followUpCompleted: !!e.followUpCompletedAt,
    })),
    reactions: entries.flatMap((e) =>
      e.reactions.map((r) => ({
        foodRaw: e.rawText,
        energyLevel: r.energyLevel ?? null,
        bloating: r.bloating ?? null,
        gas: r.gas ?? null,
        stomachDiscomfort: r.stomachDiscomfort ?? null,
        mood: r.mood ?? null,
        ateYesterdaySame: r.ateYesterdaySame ?? null,
        symptomsBetterOrWorse: r.symptomsBetterOrWorse ?? null,
      })),
    ),
  };
}

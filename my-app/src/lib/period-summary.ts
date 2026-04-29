import type { DaySession, FoodEntry, ReactionEntry } from "@prisma/client";
import type { DailySummaryPayload } from "@/lib/summary";
import { buildDailySummaryPayload } from "@/lib/summary";

/** One calendar day in the period (ordered ascending by `localDate`). */
export type PeriodDaySlice = {
  localDate: string;
  dayOverallSurvey: string | null;
  summary: DailySummaryPayload;
};

/** Multi-day structured input for AI period summarisation. */
export type PeriodSummaryPayload = {
  days: PeriodDaySlice[];
};

/** Shape returned by Prisma for {@link buildPeriodSummaryPayloadFromSessions}. */
export type DaySessionForPeriodSummary = DaySession & {
  foodEntries: Array<FoodEntry & { reactions: ReactionEntry[] }>;
  dailySummary: { dayOverallSurvey: string | null } | null;
};

export function buildPeriodSummaryPayloadFromSessions(
  sessions: DaySessionForPeriodSummary[],
): PeriodSummaryPayload {
  const days = sessions.map((s) => ({
    localDate: s.localDate,
    dayOverallSurvey: s.dailySummary?.dayOverallSurvey?.trim() || null,
    summary: buildDailySummaryPayload(s.localDate, s.foodEntries),
  }));
  return { days };
}

export function totalMealsInPeriodPayload(payload: PeriodSummaryPayload): number {
  return payload.days.reduce((acc, d) => acc + d.summary.foods.length, 0);
}

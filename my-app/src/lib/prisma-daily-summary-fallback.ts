import { Prisma } from "@prisma/client";

/** Columns present before migration `20260422130000_daily_summary_ai`. */
export const dailySummarySelectWithoutAi = {
  id: true,
  sessionId: true,
  payload: true,
  dayOverallSurvey: true,
  generatedAt: true,
} satisfies Prisma.DailySummarySelect;

/** Includes Gemini narrative fields (requires those columns in the database). */
export const dailySummarySelectFull = {
  ...dailySummarySelectWithoutAi,
  aiArticle: true,
  aiGeneratedAt: true,
} satisfies Prisma.DailySummarySelect;

/** True when the DB is missing `DailySummary.aiArticle` / `aiGeneratedAt` (migration not applied). */
export function isAiSummaryColumnsMissingError(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (e.code !== "P2022") return false;
  const msg = String(e.message);
  return msg.includes("aiArticle") || msg.includes("aiGeneratedAt");
}

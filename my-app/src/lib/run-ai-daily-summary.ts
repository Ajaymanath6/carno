import { MessageRole, Prisma, type PrismaClient } from "@prisma/client";
import { buildDailySummaryPayload } from "@/lib/summary";
import { EOD_PANEL_START_HOUR } from "@/lib/date";
import { shouldGenerateAiDailySummary } from "@/lib/eod-summary-schedule";
import { timeGreetingLine } from "@/lib/time-greeting";
import { generateGeminiDailyArticle } from "@/lib/vertex-daily-summary";
import { displayNameFromUser } from "@/lib/display-name";

export type RunAiDailySummaryResult =
  | { status: "skipped"; reason: string }
  | { status: "ok"; sessionId: string }
  | { status: "error"; message: string };

/**
 * Generates AI article, persists `DailySummary.aiArticle`, posts an assistant message with
 * `daily_ai_summary` metadata. Idempotent: skips if `aiArticle` already set.
 */
export async function runAiDailySummaryForSession(
  prisma: PrismaClient,
  sessionId: string,
  now: Date = new Date(),
): Promise<RunAiDailySummaryResult> {
  const day = await prisma.daySession.findFirst({
    where: { id: sessionId },
    include: {
      user: true,
      foodEntries: {
        include: { reactions: true },
        orderBy: { loggedAt: "asc" },
      },
      dailySummary: true,
    },
  });

  if (!day) {
    return { status: "skipped", reason: "session_not_found" };
  }

  if (day.status !== "ACTIVE") {
    return { status: "skipped", reason: "session_not_active" };
  }

  if (day.foodEntries.length === 0) {
    return { status: "skipped", reason: "no_meals" };
  }

  if (day.dailySummary?.aiArticle?.trim()) {
    return { status: "skipped", reason: "ai_article_exists" };
  }

  const tz = day.user.timezone;
  if (
    !shouldGenerateAiDailySummary({
      now,
      timezone: tz,
      localHourThreshold: EOD_PANEL_START_HOUR,
      foodEntries: day.foodEntries,
    })
  ) {
    return { status: "skipped", reason: "schedule_not_due" };
  }

  const displayName = displayNameFromUser({
    name: day.user.name,
    email: day.user.email,
  });
  const greetingLine = timeGreetingLine(displayName, tz, now);
  const payload = buildDailySummaryPayload(day.localDate, day.foodEntries);

  let article: string;
  let aiProvider: "mock" | "studio" | "vertex";
  try {
    const out = await generateGeminiDailyArticle({
      payload,
      greetingLine,
      timezone: tz,
      displayName,
    });
    article = out.article;
    aiProvider = out.provider;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: "error", message: msg };
  }

  const aiGeneratedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.dailySummary.upsert({
      where: { sessionId: day.id },
      create: {
        sessionId: day.id,
        payload: payload as object,
        aiArticle: article,
        aiGeneratedAt,
      },
      update: {
        payload: payload as Prisma.InputJsonValue,
        aiArticle: article,
        aiGeneratedAt,
      },
    });

    await tx.chatMessage.create({
      data: {
        sessionId: day.id,
        role: MessageRole.ASSISTANT,
        body: `${greetingLine}\n\n${article}`,
        metadata: {
          type: "daily_ai_summary",
          greeting: greetingLine,
          articleText: article,
          builtWithAi: aiProvider !== "mock",
          aiProvider,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { status: "ok", sessionId: day.id };
}

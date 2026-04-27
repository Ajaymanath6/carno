"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/user";
import { getOrCreateDaySession } from "@/lib/session";
import { displayFoodTitleFromLog, normalizeFoodLabel } from "@/lib/text";
import { processDueFollowUpsForSession } from "@/lib/followups";
import { MessageRole, ConversationPhase, Prisma } from "@prisma/client";
import { formatWeekdayMonthDayForLocalDateKey, shiftLocalDateKey } from "@/lib/date";
import { displayNameFromUser } from "@/lib/display-name";
import { timeGreetingLine } from "@/lib/time-greeting";
import { buildDailySummaryPayload } from "@/lib/summary";
import { generateVertexDailyArticle } from "@/lib/vertex-daily-summary";
import { mealThumbPathForNormalizedFood } from "@/lib/meal-thumb";
import type { ReactionSnapshot } from "@/lib/reaction-summary";
import { formatReactionShortSummary } from "@/lib/reaction-summary";

/** Meal follow-up ping. Set to `3 * 60 * 60 * 1000` for production (~3 hours). */
const FOLLOW_UP_MS = 60 * 1000;

export type ActionState = { error?: string; ok?: boolean };

/**
 * Re-runs the follow-up job (due food entries → reaction prompt). The server only
 * processes this on navigation/cron otherwise, so the client calls this on an
 * interval while the user stays on the chat page.
 */
export async function pollDueFollowUps(sessionId: string): Promise<void> {
  await processDueFollowUpsForSession(sessionId);
  revalidatePath("/chat");
}

export async function sendMealMessage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return { error: "Not signed in" };
  }
  const text = String(formData.get("message") ?? "").trim();
  if (!text) {
    return { error: "Enter what you ate." };
  }

  const day = await getOrCreateDaySession(appUser.id, appUser.timezone);

  if (day.phase !== ConversationPhase.CHAT) {
    return {
      error:
        "Finish your symptom check-in first (sliders below), then log your next meal.",
    };
  }

  const foodNameNormalized = normalizeFoodLabel(text.split(/[.,;]/)[0] ?? text);
  const followUpDueAt = new Date(Date.now() + FOLLOW_UP_MS);
  const mealThumb = mealThumbPathForNormalizedFood(foodNameNormalized);
  const savedFoodLabel = foodNameNormalized.slice(0, 80);
  const savedFoodDisplay =
    savedFoodLabel.length > 0
      ? savedFoodLabel.charAt(0).toUpperCase() + savedFoodLabel.slice(1)
      : savedFoodLabel;

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        sessionId: day.id,
        role: MessageRole.USER,
        body: text,
        ...(mealThumb != null
          ? { metadata: { mealThumb } as Prisma.InputJsonValue }
          : {}),
      },
    }),
    prisma.foodEntry.create({
      data: {
        sessionId: day.id,
        rawText: text,
        foodNameNormalized,
        followUpDueAt,
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId: day.id,
        role: MessageRole.ASSISTANT,
        body:
          `Got it — I’ve saved ${savedFoodDisplay}. In about a minute I’ll check in ` +
          `on how that sat with you (around ${followUpDueAt.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            timeZone: appUser.timezone,
          })} your time).`,
        ...(mealThumb != null
          ? { metadata: { mealThumb } as Prisma.InputJsonValue }
          : {}),
      },
    }),
  ]);

  await processDueFollowUpsForSession(day.id);
  revalidatePath("/chat");
  return { ok: true };
}

export async function submitReaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return { error: "Not signed in" };
  }

  const foodEntryId = String(formData.get("foodEntryId") ?? "");
  if (!foodEntryId) {
    return { error: "Missing meal reference." };
  }

  const entry = await prisma.foodEntry.findFirst({
    where: {
      id: foodEntryId,
      session: { userId: appUser.id },
    },
    include: {
      session: {
        include: { user: true },
      },
    },
  });

  if (!entry) {
    return { error: "Entry not found." };
  }

  if (entry.session.pendingFoodEntryId !== entry.id) {
    return { error: "This check-in is no longer active." };
  }

  const num = (key: string) => {
    const v = formData.get(key);
    if (v === null || v === "") {
      return null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : null;
  };

  const ateRaw = formData.get("ateYesterdaySame");
  if (ateRaw !== "yes" && ateRaw !== "no") {
    return {
      error:
        "Please answer whether you ate the same meal yesterday (Yes / No).",
    };
  }
  const ateYesterday = ateRaw === "yes";

  const reactionSnapshot: ReactionSnapshot = {
    energyLevel: num("energyLevel"),
    bloating: num("bloating"),
    gas: num("gas"),
    stomachDiscomfort: num("stomachDiscomfort"),
    mood: num("mood"),
    notes: String(formData.get("notes") ?? "").trim().slice(0, 2000) || null,
    ateYesterdaySame: ateYesterday,
    feltDifferentNotes:
      String(formData.get("feltDifferentNotes") ?? "").trim().slice(0, 2000) ||
      null,
    symptomsBetterOrWorse:
      String(formData.get("symptomsBetterOrWorse") ?? "").trim().slice(0, 200) ||
      null,
  };

  const shortSummary = formatReactionShortSummary(reactionSnapshot);
  const mealThumb = mealThumbPathForNormalizedFood(entry.foodNameNormalized);
  const foodDisplay = displayFoodTitleFromLog(entry.rawText, entry.foodNameNormalized);

  await prisma.$transaction(async (tx) => {
    await tx.reactionEntry.create({
      data: {
        foodEntryId: entry.id,
        energyLevel: reactionSnapshot.energyLevel,
        bloating: reactionSnapshot.bloating,
        gas: reactionSnapshot.gas,
        stomachDiscomfort: reactionSnapshot.stomachDiscomfort,
        mood: reactionSnapshot.mood,
        notes: reactionSnapshot.notes,
        ateYesterdaySame: reactionSnapshot.ateYesterdaySame,
        feltDifferentNotes: reactionSnapshot.feltDifferentNotes,
        symptomsBetterOrWorse: reactionSnapshot.symptomsBetterOrWorse,
      },
    });

    await tx.foodEntry.update({
      where: { id: entry.id },
      data: { followUpCompletedAt: new Date() },
    });

    const yesterdayKey = shiftLocalDateKey(entry.session.localDate, -1);
    const similarYesterday = await tx.foodEntry.findFirst({
      where: {
        foodNameNormalized: entry.foodNameNormalized,
        session: {
          userId: entry.session.userId,
          localDate: yesterdayKey,
        },
      },
    });

    let comparison = "Thanks — saved how you felt after this meal. ";
    if (similarYesterday) {
      comparison +=
        "You logged something similar yesterday — compare energy and bloating over time in Reports.";
    } else {
      comparison +=
        "Next time you eat this again, we can compare with today’s reaction.";
    }

    await tx.chatMessage.create({
      data: {
        sessionId: entry.sessionId,
        role: MessageRole.ASSISTANT,
        body: comparison,
        metadata: {
          type: "reaction_saved",
          shortSummary,
          reaction: reactionSnapshot,
          foodDisplay,
          ...(mealThumb != null ? { mealThumb } : {}),
        } as Prisma.InputJsonValue,
      },
    });

    await tx.daySession.update({
      where: { id: entry.sessionId },
      data: {
        phase: ConversationPhase.CHAT,
        pendingFoodEntryId: null,
      },
    });
  });

  await processDueFollowUpsForSession(entry.sessionId);
  revalidatePath("/chat");
  return { ok: true };
}

export async function generateDailySummary(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return { error: "Not signed in" };
  }

  const sessionId = String(formData.get("sessionId") ?? "");
  const survey = String(formData.get("dayOverallSurvey") ?? "").slice(0, 2000);

  const day = await prisma.daySession.findFirst({
    where: { id: sessionId, userId: appUser.id },
    include: {
      foodEntries: {
        include: { reactions: true },
        orderBy: { loggedAt: "asc" },
      },
    },
  });

  if (!day) {
    return { error: "Day not found." };
  }

  const payload = buildDailySummaryPayload(day.localDate, day.foodEntries);
  const summaryDateLabel = formatWeekdayMonthDayForLocalDateKey(
    day.localDate,
    appUser.timezone,
  );

  const existingSummary = await prisma.dailySummary.findUnique({
    where: { sessionId: day.id },
  });
  const priorAi = existingSummary?.aiArticle?.trim();
  const displayName = displayNameFromUser({
    name: appUser.name,
    email: appUser.email,
  });
  const greetingLine = timeGreetingLine(displayName, appUser.timezone, new Date());

  let aiArticle: string | null = priorAi || null;
  let aiGeneratedAt: Date | null = existingSummary?.aiGeneratedAt ?? null;

  if (!priorAi) {
    try {
      aiArticle = await generateVertexDailyArticle({
        payload,
        greetingLine,
        timezone: appUser.timezone,
        displayName,
        dayOverallSurvey: survey || null,
      });
      aiGeneratedAt = new Date();
    } catch (e) {
      console.error("[generateDailySummary] Vertex AI failed:", e);
      aiArticle = null;
      aiGeneratedAt = null;
    }
  }

  const chatData = (() => {
    if (aiArticle && !priorAi) {
      return {
        body: `${greetingLine}\n\n${aiArticle}`,
        metadata: {
          type: "daily_ai_summary",
          greeting: greetingLine,
          articleText: aiArticle,
          builtWithAi: process.env.VERTEX_DISABLED !== "true",
        } as Prisma.InputJsonValue,
      };
    }
    if (priorAi) {
      return {
        body:
          `**Day closed (${summaryDateLabel})** — ${day.foodEntries.length} meal log(s), ` +
          `${payload.reactions.length} reaction(s). ` +
          (survey ? `Your reflection: ${survey}` : "Open History anytime to review."),
      };
    }
    return {
      body:
        `**Daily summary (${summaryDateLabel})**: ${day.foodEntries.length} meal log(s), ` +
        `${payload.reactions.length} reaction(s) recorded. ` +
        (survey
          ? `Your day overall: ${survey}`
          : "Open History anytime to review this day."),
    };
  })();

  await prisma.$transaction([
    prisma.dailySummary.upsert({
      where: { sessionId: day.id },
      create: {
        sessionId: day.id,
        payload: payload as object,
        dayOverallSurvey: survey || null,
        aiArticle,
        aiGeneratedAt,
      },
      update: {
        payload: payload as object,
        dayOverallSurvey: survey || null,
        ...(aiArticle ? { aiArticle, aiGeneratedAt } : {}),
      },
    }),
    prisma.daySession.update({
      where: { id: day.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId: day.id,
        role: MessageRole.ASSISTANT,
        body: chatData.body,
        ...(chatData.metadata != null ? { metadata: chatData.metadata } : {}),
      },
    }),
  ]);

  revalidatePath("/chat");
  revalidatePath("/history");
  return { ok: true };
}

"use server";

import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/user";
import { getOrCreateDaySession } from "@/lib/session";
import { normalizeFoodLabel } from "@/lib/text";
import { processDueFollowUpsForSession } from "@/lib/followups";
import { MessageRole, ConversationPhase, Prisma, SessionStatus } from "@prisma/client";
import { formatWeekdayMonthDayForLocalDateKey, shiftLocalDateKey } from "@/lib/date";
import { displayNameFromUser } from "@/lib/display-name";
import { timeGreetingLine } from "@/lib/time-greeting";
import { buildDailySummaryPayload } from "@/lib/summary";
import { generateGeminiDailyArticle } from "@/lib/vertex-daily-summary";
import { mealThumbPathForNormalizedFood } from "@/lib/meal-thumb";
import { parseBasicPortionFromText } from "@/lib/portion";
import type { ReactionSnapshot } from "@/lib/reaction-summary";
import { formatReactionShortSummary } from "@/lib/reaction-summary";

/** Meal follow-up ping. Set to `3 * 60 * 60 * 1000` for production (~3 hours). */
const FOLLOW_UP_MS = 60 * 1000;

export type ActionState = { error?: string; ok?: boolean };

function formatMealItems(items: string[]): string {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  const joined = cleaned.join(" ");
  return joined.length <= 500 ? joined : `${joined.slice(0, 497)}...`;
}

function splitInlineMealItems(line: string): string[] {
  const s = line.trim();
  if (!s) {
    return [];
  }
  const parts = s.split(
    /\s+(?=\d+(?:\.\d+)?\s+(?:spoons?|tbsp|tablespoons?|eggs?|egg|ghee|beef|steak|chicken|chiken|mutton|paneer|lamb|pork|fish|salmon|tuna|shrimp|butter|cream|apple(?:s)?|banana(?:s)?|mango(?:es|s)?|cucumber(?:s)?)\b)/gi,
  );
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Maps DB connectivity failures to a safe user message (avoids crashing the UI when Neon is unreachable). */
function prismaDatabaseUnavailableMessage(error: unknown): string | null {
  if (error instanceof PrismaClientInitializationError) {
    return (
      "Can't connect to the database. Check DATABASE_URL is set (Neon project active), " +
      "copy the same values to Vercel for deployments, then try again."
    );
  }
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P1001" || error.code === "P1017") {
      return (
        "Can't reach the database server. Confirm Neon is running and DATABASE_URL matches your branch; " +
        "for Vercel, redeploy after updating environment variables."
      );
    }
  }
  if (error instanceof Error && /can't reach database server/i.test(error.message)) {
    return (
      "Can't reach the database server. Resume or verify your Neon project and DATABASE_URL in this environment."
    );
  }
  return null;
}

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

  const followUpDueAt = new Date(Date.now() + FOLLOW_UP_MS);
  const parts = splitMealMessageIntoEntries(text);
  const savedFoodDisplay =
    parts.length === 1 ?
      (() => {
        const foodNameNormalized = normalizeFoodLabel(parts[0] ?? text);
        const savedFoodLabel = foodNameNormalized.slice(0, 80);
        return savedFoodLabel.length > 0
          ? savedFoodLabel.charAt(0).toUpperCase() + savedFoodLabel.slice(1)
          : savedFoodLabel;
      })()
    : `${parts.length} items`;

  const userMessageCreates = parts.map((p) => {
    const normalized = normalizeFoodLabel(p.split(/[.,;]/)[0] ?? p);
    const mealThumb = mealThumbPathForNormalizedFood(normalized);
    return prisma.chatMessage.create({
      data: {
        sessionId: day.id,
        role: MessageRole.USER,
        body: p,
        ...(mealThumb != null ? { metadata: { mealThumb } as Prisma.InputJsonValue } : {}),
      },
    });
  });

  const foodCreates = parts.map((p) => {
    const normalized = normalizeFoodLabel(p.split(/[.,;]/)[0] ?? p);
    const portion = parseBasicPortionFromText(p);
    return prisma.foodEntry.create({
      data: {
        sessionId: day.id,
        rawText: p,
        foodNameNormalized: normalized,
        ...(portion ? { quantity: portion.quantity, unit: portion.unit } : {}),
        followUpDueAt,
      },
    });
  });

  await prisma.$transaction([
    ...userMessageCreates,
    ...foodCreates,
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
      },
    }),
  ]);

  await processDueFollowUpsForSession(day.id);
  revalidatePath("/chat");
  return { ok: true };
}

function splitMealMessageIntoEntries(text: string): string[] {
  const base = text
    .split(/\n+/g)
    .flatMap((line) => line.split(/\s+(?:and|&)\s+|,\s*/gi))
    .flatMap((segment) => splitInlineMealItems(segment));
  const raw = base.map((s) => s.trim()).filter(Boolean);
  // If splitting produced nonsense (e.g. empty or only separators), fall back to original.
  return raw.length > 0 ? raw : [text.trim()];
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
    return {
      error:
        "This check-in is no longer active—the app may have moved on (e.g. refresh or another tab). " +
        "Reload the chat page and use the check-in shown for your current meal.",
    };
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

  await prisma.$transaction(async (tx) => {
    const groupedEntries = await tx.foodEntry.findMany({
      where: {
        sessionId: entry.sessionId,
        followUpDueAt: entry.followUpDueAt,
        followUpPromptSentAt: { not: null },
        followUpCompletedAt: null,
      },
      orderBy: { loggedAt: "asc" },
      select: {
        id: true,
        rawText: true,
      },
    });

    const targetEntries =
      groupedEntries.length > 0
        ? groupedEntries
        : [{ id: entry.id, rawText: entry.rawText }];
    const targetEntryIds = targetEntries.map((food) => food.id);
    const foodDisplay = formatMealItems(targetEntries.map((food) => food.rawText));
    const mealThumb = mealThumbPathForNormalizedFood(foodDisplay);

    await tx.reactionEntry.createMany({
      data: targetEntryIds.map((foodEntryId) => ({
        foodEntryId,
        energyLevel: reactionSnapshot.energyLevel,
        bloating: reactionSnapshot.bloating,
        gas: reactionSnapshot.gas,
        stomachDiscomfort: reactionSnapshot.stomachDiscomfort,
        mood: reactionSnapshot.mood,
        notes: reactionSnapshot.notes,
        ateYesterdaySame: reactionSnapshot.ateYesterdaySame,
        feltDifferentNotes: reactionSnapshot.feltDifferentNotes,
        symptomsBetterOrWorse: reactionSnapshot.symptomsBetterOrWorse,
      })),
    });

    await tx.foodEntry.updateMany({
      where: { id: { in: targetEntryIds } },
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
          foodEntryIds: targetEntryIds,
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

export async function deleteLoggedMealEntries(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return { error: "Not signed in" };
  }

  const idsRaw = String(formData.get("foodEntryIds") ?? "");
  const ids = idsRaw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    return { error: "Nothing to delete." };
  }

  const ownedEntries = await prisma.foodEntry.findMany({
    where: {
      id: { in: ids },
      session: { userId: appUser.id },
    },
    select: { id: true, sessionId: true, rawText: true },
  });
  if (ownedEntries.length === 0) {
    return { error: "Meal entry not found." };
  }

  const ownedIds = ownedEntries.map((e) => e.id);
  const sessionIds = Array.from(new Set(ownedEntries.map((e) => e.sessionId)));
  const rawTexts = Array.from(new Set(ownedEntries.map((e) => e.rawText)));

  await prisma.$transaction(async (tx) => {
    // Remove chat lines that directly correspond to deleted food logs.
    await tx.chatMessage.deleteMany({
      where: {
        sessionId: { in: sessionIds },
        role: MessageRole.USER,
        body: { in: rawTexts },
      },
    });

    // Remove follow-up / reaction assistant rows tied to the deleted entries.
    for (const id of ownedIds) {
      await tx.chatMessage.deleteMany({
        where: {
          sessionId: { in: sessionIds },
          OR: [
            { metadata: { path: ["foodEntryId"], equals: id } },
            { metadata: { path: ["foodEntryIds"], array_contains: [id] } },
          ],
        },
      });
    }

    await tx.foodEntry.deleteMany({
      where: { id: { in: ownedIds } },
    });
    await tx.daySession.updateMany({
      where: {
        id: { in: sessionIds },
        pendingFoodEntryId: { in: ownedIds },
      },
      data: {
        pendingFoodEntryId: null,
        phase: ConversationPhase.CHAT,
      },
    });
  });

  revalidatePath("/chat");
  revalidatePath("/history");
  return { ok: true };
}

/**
 * In-chat AI summary only: does not persist DailySummary or close the day (so EOD cron still runs).
 */
export async function previewDailySummary(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const appUser = await getOrCreateAppUser();
    if (!appUser) {
      return { error: "Not signed in" };
    }

    const sessionId = String(formData.get("sessionId") ?? "");

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

    if (day.status !== SessionStatus.ACTIVE) {
      return { error: "Open today’s chat to request a summary." };
    }

    if (day.phase !== ConversationPhase.CHAT) {
      return { error: "Finish the symptom check-in first, then try Summary again." };
    }

    if (day.foodEntries.length === 0) {
      return { error: "Log at least one meal first." };
    }

    const payload = buildDailySummaryPayload(day.localDate, day.foodEntries);
    const displayName = displayNameFromUser({
      name: appUser.name,
      email: appUser.email,
    });
    const greetingLine = timeGreetingLine(displayName, appUser.timezone, new Date());

    let aiArticle: string;
    let aiProvider: "mock" | "studio" | "vertex";
    try {
      const out = await generateGeminiDailyArticle({
        payload,
        greetingLine,
        timezone: appUser.timezone,
        displayName,
        preview: true,
      });
      aiArticle = out.article;
      aiProvider = out.provider;
    } catch (e) {
      console.error("[previewDailySummary] Gemini AI failed:", e);
      const msg = e instanceof Error ? e.message : "Could not generate summary.";
      return { error: msg };
    }

    await prisma.chatMessage.create({
      data: {
        sessionId: day.id,
        role: MessageRole.ASSISTANT,
        body: `${greetingLine}\n\n${aiArticle}`,
        metadata: {
          type: "daily_ai_summary_preview",
          localDateKey: day.localDate,
          greeting: greetingLine,
          articleText: aiArticle,
          builtWithAi: aiProvider !== "mock",
          aiProvider,
        } as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/chat");
    revalidatePath("/history");
    return { ok: true };
  } catch (e) {
    const dbMsg = prismaDatabaseUnavailableMessage(e);
    if (dbMsg) {
      console.error("[previewDailySummary] Database unavailable:", e);
      return { error: dbMsg };
    }
    throw e;
  }
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

  let aiProvider: "mock" | "studio" | "vertex" | null = null;

  if (!priorAi) {
    try {
      const out = await generateGeminiDailyArticle({
        payload,
        greetingLine,
        timezone: appUser.timezone,
        displayName,
        dayOverallSurvey: survey || null,
      });
      aiArticle = out.article;
      aiProvider = out.provider;
      aiGeneratedAt = new Date();
    } catch (e) {
      console.error("[generateDailySummary] Gemini AI failed:", e);
      aiArticle = null;
      aiProvider = null;
      aiGeneratedAt = null;
    }
  }

  const chatData = (() => {
    if (aiArticle && !priorAi) {
      return {
        body: `${greetingLine}\n\n${aiArticle}`,
        metadata: {
          type: "daily_ai_summary",
          localDateKey: day.localDate,
          greeting: greetingLine,
          articleText: aiArticle,
          builtWithAi: aiProvider !== "mock" && aiProvider != null,
          ...(aiProvider != null ? { aiProvider } : {}),
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

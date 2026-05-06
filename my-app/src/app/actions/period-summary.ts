"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/user";
import { displayNameFromUser } from "@/lib/display-name";
import { formatPeriodDateRangeLabel } from "@/lib/date";
import {
  buildPeriodSummaryPayloadFromSessions,
  totalMealsInPeriodPayload,
} from "@/lib/period-summary";
import { friendlyGeminiQuotaMessage } from "@/lib/gemini-error-message";
import { generateGeminiPeriodArticle } from "@/lib/vertex-period-summary";

export type PeriodClinicalSummaryResult =
  | {
      ok: true;
      article: string;
      dayCount: number;
      dateRangeLabel: string;
      provider: string | null;
    }
  | { ok: false; error: string };

export async function generatePeriodClinicalSummary(): Promise<PeriodClinicalSummaryResult> {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return { ok: false, error: "Not signed in." };
  }

  const sessions = await prisma.daySession.findMany({
    where: { userId: appUser.id },
    orderBy: { localDate: "asc" },
    include: {
      foodEntries: {
        include: { reactions: true },
        orderBy: { loggedAt: "asc" },
      },
      dailySummary: { select: { dayOverallSurvey: true } },
    },
  });

  if (sessions.length === 0) {
    return {
      ok: false,
      error: "No logged days yet. Add meals from Chat first.",
    };
  }

  const payload = buildPeriodSummaryPayloadFromSessions(sessions);

  if (totalMealsInPeriodPayload(payload) === 0) {
    return {
      ok: false,
      error: "No meals logged across these days yet. Log at least one meal to generate a summary.",
    };
  }

  const firstKey = sessions[0]?.localDate;
  const lastKey = sessions[sessions.length - 1]?.localDate;
  const dateRangeLabel = formatPeriodDateRangeLabel(firstKey, lastKey, appUser.timezone);

  const displayName = displayNameFromUser({
    name: appUser.name,
    email: appUser.email,
  });

  try {
    const out = await generateGeminiPeriodArticle({
      payload,
      timezone: appUser.timezone,
      displayName,
      dateRangeLabel,
      dayCount: sessions.length,
    });
    return {
      ok: true,
      article: out.article,
      dayCount: sessions.length,
      dateRangeLabel,
      provider: out.provider === "mock" ? null : out.provider,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[generatePeriodClinicalSummary]", e);
    return {
      ok: false,
      error: friendlyGeminiQuotaMessage(msg || "Could not generate summary."),
    };
  }
}

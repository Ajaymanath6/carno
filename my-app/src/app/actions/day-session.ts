"use server";

import { revalidatePath } from "next/cache";
import { ConversationPhase, MessageRole, SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getLocalDateKey } from "@/lib/date";
import { getOrCreateAppUser } from "@/lib/user";
import { DAY_CHAT_WELCOME_BODY } from "@/lib/session";

export type ResetDaySessionState = { ok?: boolean; error?: string };

/**
 * Clears today’s chat, meals, reactions, and summary for the signed-in user,
 * then re-seeds the welcome assistant line. Only when the day is ACTIVE and in CHAT phase.
 */
export async function resetActiveDaySessionForToday(
  prev: ResetDaySessionState,
  formData: FormData,
): Promise<ResetDaySessionState> {
  void prev;
  void formData;
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return { error: "Not signed in." };
  }

  const localDate = getLocalDateKey(appUser.timezone);
  const session = await prisma.daySession.findUnique({
    where: {
      userId_localDate: { userId: appUser.id, localDate },
    },
  });

  if (!session) {
    return { error: "No session for today yet." };
  }

  if (session.status !== SessionStatus.ACTIVE) {
    return { error: "This day is already closed. Open a new calendar day to chat." };
  }

  if (session.phase !== ConversationPhase.CHAT) {
    return {
      error: "Finish your symptom check-in first, then you can start fresh if you need to.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.dailySummary.deleteMany({ where: { sessionId: session.id } });
    await tx.chatMessage.deleteMany({ where: { sessionId: session.id } });
    await tx.foodEntry.deleteMany({ where: { sessionId: session.id } });
    await tx.daySession.update({
      where: { id: session.id },
      data: {
        phase: ConversationPhase.CHAT,
        pendingFoodEntryId: null,
        closedAt: null,
      },
    });
    await tx.chatMessage.create({
      data: {
        sessionId: session.id,
        role: MessageRole.ASSISTANT,
        body: DAY_CHAT_WELCOME_BODY,
      },
    });
  });

  revalidatePath("/chat");
  revalidatePath("/history");
  return { ok: true };
}

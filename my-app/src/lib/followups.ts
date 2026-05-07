import { ConversationPhase, MessageRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function compactMealLabel(parts: string[]): string {
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  const joined = cleaned.join(" ");
  return joined.length <= 500 ? joined : `${joined.slice(0, 497)}...`;
}

/**
 * When follow-up time has passed, posts the assistant prompt once (FIFO by due time).
 */
export async function processDueFollowUpsForSession(sessionId: string): Promise<void> {
  const now = new Date();

  // IMPORTANT: Avoid interactive transactions here.
  // Neon pooler connections (and some serverless environments) can time out or disallow
  // interactive transactions, causing "Unable to start a transaction" errors.
  //
  // We still keep correctness by claiming the row via updateMany (atomic) and then
  // writing the chat+session updates in a single non-interactive transaction batch.

  const next = await prisma.foodEntry.findFirst({
    where: {
      sessionId,
      followUpCompletedAt: null,
      followUpPromptSentAt: null,
      followUpDueAt: { lte: now },
    },
    orderBy: { followUpDueAt: "asc" },
  });

  if (!next) {
    return;
  }

  const grouped = await prisma.foodEntry.findMany({
    where: {
      sessionId,
      followUpCompletedAt: null,
      followUpPromptSentAt: null,
      followUpDueAt: next.followUpDueAt,
    },
    orderBy: { loggedAt: "asc" },
    select: { id: true, rawText: true },
  });
  const groupedIds = grouped.map((g) => g.id);
  if (groupedIds.length === 0) {
    return;
  }
  const combinedMealText = compactMealLabel(grouped.map((g) => g.rawText));

  const claimed = await prisma.foodEntry.updateMany({
    where: {
      id: { in: groupedIds },
      followUpPromptSentAt: null,
    },
    data: {
      followUpPromptSentAt: now,
      followUpNotifiedAt: now,
    },
  });

  if (claimed.count !== groupedIds.length) {
    return;
  }

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        sessionId,
        role: MessageRole.ASSISTANT,
        body:
          `Checking in — you logged: “${combinedMealText}”. ` +
          `How did you feel after eating this? Use the sliders below, then answer the follow-up questions.`,
        metadata: {
          type: "follow_up_prompt",
          foodEntryId: next.id,
          foodEntryIds: groupedIds,
        } as Prisma.InputJsonValue,
      },
    }),
    prisma.daySession.update({
      where: { id: sessionId },
      data: {
        phase: ConversationPhase.ASK_REACTION,
        pendingFoodEntryId: next.id,
      },
    }),
  ]);
}

import { ConversationPhase, MessageRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

  const claimed = await prisma.foodEntry.updateMany({
    where: {
      id: next.id,
      followUpPromptSentAt: null,
    },
    data: {
      followUpPromptSentAt: now,
      followUpNotifiedAt: now,
    },
  });

  if (claimed.count !== 1) {
    return;
  }

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        sessionId,
        role: MessageRole.ASSISTANT,
        body:
          `Checking in — you logged: “${next.rawText.slice(0, 500)}”. ` +
          `How did you feel after eating this? Use the sliders below, then answer the follow-up questions.`,
        metadata: {
          type: "follow_up_prompt",
          foodEntryId: next.id,
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

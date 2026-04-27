import { ConversationPhase, MessageRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * When follow-up time has passed, posts the assistant prompt once (FIFO by due time).
 */
export async function processDueFollowUpsForSession(sessionId: string): Promise<void> {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const next = await tx.foodEntry.findFirst({
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

    const claimed = await tx.foodEntry.updateMany({
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

    await tx.chatMessage.create({
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
    });

    await tx.daySession.update({
      where: { id: sessionId },
      data: {
        phase: ConversationPhase.ASK_REACTION,
        pendingFoodEntryId: next.id,
      },
    });
  });
}

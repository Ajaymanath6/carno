import { ConversationPhase, MessageRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * When follow-up time has passed, posts the assistant prompt once (FIFO by due time).
 */
export async function processDueFollowUpsForSession(sessionId: string): Promise<void> {
  const now = new Date();

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

  await prisma.$transaction([
    prisma.foodEntry.update({
      where: { id: next.id },
      data: {
        followUpPromptSentAt: now,
        followUpNotifiedAt: now,
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId,
        role: MessageRole.ASSISTANT,
        body:
          `It’s been about 3 hours since you logged: “${next.rawText.slice(0, 500)}”. ` +
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

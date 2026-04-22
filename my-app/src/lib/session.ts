import type { DaySession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getLocalDateKey } from "@/lib/date";

export async function getOrCreateDaySession(
  userId: string,
  timezone: string,
): Promise<DaySession> {
  const localDate = getLocalDateKey(timezone);
  const existing = await prisma.daySession.findUnique({
    where: {
      userId_localDate: { userId, localDate },
    },
  });
  if (existing) {
    return existing;
  }
  const session = await prisma.daySession.create({
    data: {
      userId,
      localDate,
    },
  });
  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "ASSISTANT",
      body:
        "Hi — log anything you eat here (for example: “600g chicken and rice”). " +
        "About three hours after each meal I’ll ask how you felt so we can spot patterns.",
    },
  });
  return session;
}

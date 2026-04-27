import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { displayNameFromUser } from "@/lib/display-name";
import { getOrCreateAppUser } from "@/lib/user";
import { getOrCreateDaySession } from "@/lib/session";
import { processDueFollowUpsForSession } from "@/lib/followups";
import { ChatClient } from "@/components/chat/ChatClient";

export default async function ChatPage() {
  const user = await getOrCreateAppUser();
  if (!user) {
    redirect("/login");
  }

  const day = await getOrCreateDaySession(user.id, user.timezone);
  await processDueFollowUpsForSession(day.id);

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId: day.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, body: true, createdAt: true, metadata: true },
  });

  const refreshed = await prisma.daySession.findUnique({
    where: { id: day.id },
  });

  if (!refreshed) {
    redirect("/chat");
  }

  const foodEntryCount = await prisma.foodEntry.count({
    where: { sessionId: refreshed.id },
  });

  const displayName = displayNameFromUser({
    name: user.name,
    email: user.email,
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col md:min-h-0">
      <ChatClient
        messages={messages}
        sessionId={refreshed.id}
        phase={refreshed.phase}
        sessionStatus={refreshed.status}
        pendingFoodEntryId={refreshed.pendingFoodEntryId}
        timezone={user.timezone}
        displayName={displayName}
        localDate={refreshed.localDate}
        foodEntryCount={foodEntryCount}
      />
    </main>
  );
}

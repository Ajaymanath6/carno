import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { displayNameFromUser } from "@/lib/display-name";
import { getOrCreateAppUser } from "@/lib/user";
import { getOrCreateDaySession } from "@/lib/session";
import { processDueFollowUpsForSession } from "@/lib/followups";
import { ChatClient } from "@/components/chat/ChatClient";

/** Always personalised server data (messages, meal count); avoids CDN caching a stale shell without the Summary badge. */
export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await getOrCreateAppUser();
  if (!user) {
    redirect("/login");
  }

  const day = await getOrCreateDaySession(user.id, user.timezone);
  await processDueFollowUpsForSession(day.id);

  const messagesRaw = await prisma.chatMessage.findMany({
    where: { session: { userId: user.id } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      body: true,
      createdAt: true,
      metadata: true,
      session: { select: { localDate: true } },
    },
  });

  const messages = messagesRaw.map(({ session, ...row }) => ({
    ...row,
    sessionLocalDate: session.localDate,
  }));

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
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-sm text-brandcolor-text-weak">
            Loading…
          </div>
        }
      >
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
      </Suspense>
    </main>
  );
}

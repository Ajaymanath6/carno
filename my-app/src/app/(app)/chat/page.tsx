import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getOrCreateDaySession } from "@/lib/session";
import { processDueFollowUpsForSession } from "@/lib/followups";
import { ChatClient } from "@/components/chat/ChatClient";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    redirect("/login");
  }

  const day = await getOrCreateDaySession(user.id, user.timezone);
  await processDueFollowUpsForSession(day.id);

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId: day.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, body: true, createdAt: true },
  });

  const refreshed = await prisma.daySession.findUnique({
    where: { id: day.id },
  });

  if (!refreshed) {
    redirect("/chat");
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col md:min-h-[calc(100dvh-52px)]">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <h1 className="text-lg font-semibold">Today · {refreshed.localDate}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Log meals anytime. After ~3 hours you’ll get a symptom check-in for that meal.
        </p>
      </div>
      <ChatClient
        messages={messages}
        sessionId={refreshed.id}
        phase={refreshed.phase}
        sessionStatus={refreshed.status}
        pendingFoodEntryId={refreshed.pendingFoodEntryId}
        timezone={user.timezone}
      />
    </main>
  );
}

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
    select: { id: true, role: true, body: true, createdAt: true },
  });

  const refreshed = await prisma.daySession.findUnique({
    where: { id: day.id },
  });

  if (!refreshed) {
    redirect("/chat");
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col md:min-h-0">
      <div className="border-b border-brandcolor-strokeweak bg-brandcolor-white px-4 py-3">
        <h1 className="font-serif text-lg font-semibold text-brandcolor-text-strong">
          Today · {refreshed.localDate}
        </h1>
        <p className="text-sm text-brandcolor-text-weak">
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

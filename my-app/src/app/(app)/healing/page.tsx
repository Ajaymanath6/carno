import { redirect } from "next/navigation";
import { displayNameFromUser } from "@/lib/display-name";
import { getLocalDateKey } from "@/lib/date";
import { getOrCreateAppUser } from "@/lib/user";
import { HealingClient } from "@/components/healing/HealingClient";

/** Personalized greeting and date badge; parity with `/learnings`. */
export const dynamic = "force-dynamic";

export default async function HealingPage() {
  const user = await getOrCreateAppUser();
  if (!user) {
    redirect("/login");
  }

  const localDate = getLocalDateKey(user.timezone);
  const displayName = displayNameFromUser({
    name: user.name,
    email: user.email,
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col md:min-h-0">
      <HealingClient
        localDate={localDate}
        timezone={user.timezone}
        displayName={displayName}
      />
    </main>
  );
}

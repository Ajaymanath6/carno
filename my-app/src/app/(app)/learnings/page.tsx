import { redirect } from "next/navigation";
import { displayNameFromUser } from "@/lib/display-name";
import { getLocalDateKey } from "@/lib/date";
import { getOrCreateAppUser } from "@/lib/user";
import { LearningsClient } from "@/components/learnings/LearningsClient";

/** Personalized greeting and date badge; parity with `/chat`. */
export const dynamic = "force-dynamic";

export default async function LearningsPage() {
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
      <LearningsClient
        localDate={localDate}
        timezone={user.timezone}
        displayName={displayName}
      />
    </main>
  );
}

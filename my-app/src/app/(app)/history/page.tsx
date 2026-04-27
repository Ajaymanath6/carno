import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatWeekdayMonthDayForLocalDateKey } from "@/lib/date";
import { getOrCreateAppUser } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const user = await getOrCreateAppUser();
  if (!user) {
    redirect("/login");
  }

  const days = await prisma.daySession.findMany({
    where: { userId: user.id },
    orderBy: { localDate: "desc" },
    take: 90,
    include: {
      dailySummary: true,
      foodEntries: { select: { id: true } },
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <div>
        <h1 className="font-serif text-xl font-semibold text-brandcolor-text-strong">Chats</h1>
        <p className="mt-1 text-sm text-brandcolor-text-weak">
          Recent days (newest first). Closed days include a saved summary.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {days.map((d) => (
          <li key={d.id}>
            <Link
              href={`/history/${d.localDate}`}
              className="flex items-center justify-between rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white px-4 py-3 text-sm text-brandcolor-text-strong hover:bg-brandcolor-fill"
            >
              <span className="font-medium">
                {formatWeekdayMonthDayForLocalDateKey(d.localDate, user.timezone)}
              </span>
              <span className="text-brandcolor-text-weak">
                {d.status === "CLOSED" ? "Closed" : "Active"} · {d.foodEntries.length}{" "}
                meal(s)
                {d.dailySummary ? " · summary" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {days.length === 0 && (
        <p className="text-sm text-brandcolor-text-weak">
          No days yet. Start logging from{" "}
          <Link className="text-brandcolor-primary hover:underline" href="/chat">
            Chat
          </Link>
          .
        </p>
      )}
    </main>
  );
}

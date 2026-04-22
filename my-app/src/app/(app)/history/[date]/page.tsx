import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

export default async function HistoryDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const day = await prisma.daySession.findFirst({
    where: { userId: session.user.id, localDate: date },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      dailySummary: true,
      foodEntries: {
        include: { reactions: true },
        orderBy: { loggedAt: "asc" },
      },
    },
  });

  if (!day) {
    notFound();
  }

  const payload = day.dailySummary?.payload as {
    foods?: unknown;
    reactions?: unknown;
  } | null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <Link
          href="/history"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          ← Back
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{day.localDate}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Status: {day.status}
        </p>
      </div>

      {day.dailySummary && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4">
          <h2 className="font-medium">Daily summary</h2>
          {day.dailySummary.dayOverallSurvey && (
            <p className="mt-2 text-sm">{day.dailySummary.dayOverallSurvey}</p>
          )}
          <pre className="mt-3 overflow-x-auto text-xs text-[var(--color-muted-foreground)]">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </section>
      )}

      <section>
        <h2 className="font-medium">Meals & reactions</h2>
        <ul className="mt-2 flex flex-col gap-3">
          {day.foodEntries.map((f) => (
            <li
              key={f.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
            >
              <p className="font-medium">{f.rawText}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Logged {f.loggedAt.toISOString()}
              </p>
              {f.reactions.map((r) => (
                <div
                  key={r.id}
                  className="mt-2 grid gap-1 border-t border-[var(--color-border)] pt-2 text-xs sm:grid-cols-2"
                >
                  <span>Energy {r.energyLevel ?? "—"}</span>
                  <span>Bloating {r.bloating ?? "—"}</span>
                  <span>Gas {r.gas ?? "—"}</span>
                  <span>Stomach {r.stomachDiscomfort ?? "—"}</span>
                  <span>Mood {r.mood ?? "—"}</span>
                  <span>
                    Same yesterday?{" "}
                    {r.ateYesterdaySame === null
                      ? "—"
                      : r.ateYesterdaySame
                        ? "yes"
                        : "no"}
                  </span>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Chat transcript</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {day.messages.map((m) => (
            <li key={m.id} className="text-sm">
              <span className="font-semibold">{m.role}:</span>{" "}
              <span className="whitespace-pre-wrap">{m.body}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

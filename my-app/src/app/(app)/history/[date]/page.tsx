import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FoodEntryHistoryCard } from "@/components/history/FoodEntryHistoryCard";
import { formatWeekdayMonthDayForLocalDateKey } from "@/lib/date";
import { getOrCreateAppUser } from "@/lib/user";
import {
  dailySummarySelectFull,
  dailySummarySelectWithoutAi,
  isAiSummaryColumnsMissingError,
} from "@/lib/prisma-daily-summary-fallback";
import { redirect, notFound } from "next/navigation";

export default async function HistoryDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const user = await getOrCreateAppUser();
  if (!user) {
    redirect("/login");
  }

  const includeWithAi = {
    messages: { orderBy: { createdAt: "asc" as const } },
    dailySummary: { select: dailySummarySelectFull },
    foodEntries: {
      include: { reactions: true },
      orderBy: { loggedAt: "asc" as const },
    },
  } as const;

  let day;
  try {
    day = await prisma.daySession.findFirst({
      where: { userId: user.id, localDate: date },
      include: includeWithAi,
    });
  } catch (e) {
    if (!isAiSummaryColumnsMissingError(e)) throw e;
    day = await prisma.daySession.findFirst({
      where: { userId: user.id, localDate: date },
      include: {
        ...includeWithAi,
        dailySummary: { select: dailySummarySelectWithoutAi },
      },
    });
  }

  if (!day) {
    notFound();
  }

  /** Widen type when DB predates `aiArticle` columns (fallback query omits those keys). */
  const summaryView = day.dailySummary as
    | (NonNullable<typeof day.dailySummary> & {
        aiArticle?: string | null;
        aiGeneratedAt?: Date | null;
      })
    | null;

  const payload = day.dailySummary?.payload as {
    foods?: unknown;
    reactions?: unknown;
  } | null;

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
          <div>
            <Link
              href="/history"
              className="text-sm text-brandcolor-primary hover:underline"
            >
              ← Back
            </Link>
            <h1 className="mt-2 font-serif text-xl font-semibold text-brandcolor-text-strong">
              {formatWeekdayMonthDayForLocalDateKey(day.localDate, user.timezone)}
            </h1>
            <p className="mt-1 text-sm text-brandcolor-text-weak">
              Status: {day.status}
            </p>
          </div>

          {day.dailySummary && (
            <section className="rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-4">
              <h2 className="font-medium text-brandcolor-text-strong">Daily summary</h2>
              {day.dailySummary.dayOverallSurvey && (
                <p className="mt-2 text-sm">{day.dailySummary.dayOverallSurvey}</p>
              )}
              {summaryView?.aiArticle?.trim() ? (
                <div className="mt-3 rounded-xl bg-brandcolor-fill px-4 py-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brandcolor-text-weak">
                    AI narrative
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brandcolor-text-strong">
                    {summaryView.aiArticle}
                  </p>
                  {summaryView.aiGeneratedAt ? (
                    <p className="mt-2 text-xs text-brandcolor-text-weak">
                      Generated{" "}
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(summaryView.aiGeneratedAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <pre className="mt-3 overflow-x-auto text-xs text-brandcolor-text-weak">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </section>
          )}

          <section>
            <h2 className="font-medium text-brandcolor-text-strong">Meals & reactions</h2>
            <ul className="mt-2 flex flex-col gap-3">
              {day.foodEntries.map((f) => (
                <FoodEntryHistoryCard
                  key={f.id}
                  rawText={f.rawText}
                  foodNameNormalized={f.foodNameNormalized}
                  loggedAt={f.loggedAt}
                  timezone={user.timezone}
                  reactions={f.reactions}
                />
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-medium text-brandcolor-text-strong">Chat transcript</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {day.messages.map((m) => (
                <li key={m.id} className="text-sm text-brandcolor-text-strong">
                  <span className="font-semibold">
                    {m.role === "USER"
                      ? "You"
                      : m.role === "ASSISTANT"
                        ? "Assistant"
                        : m.role}
                    :
                  </span>{" "}
                  <span className="whitespace-pre-wrap">{m.body}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

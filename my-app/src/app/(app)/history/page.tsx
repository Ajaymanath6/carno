import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatWeekdayMonthDayForLocalDateKey } from "@/lib/date";
import { getOrCreateAppUser } from "@/lib/user";
import {
  dailySummarySelectFull,
  dailySummarySelectWithoutAi,
  isAiSummaryColumnsMissingError,
} from "@/lib/prisma-daily-summary-fallback";
import { redirect } from "next/navigation";
import { HistoryPeriodSummary } from "@/components/history/HistoryPeriodSummary";
import { HistoryCalorieBanner } from "@/components/history/HistoryCalorieBanner";
import {
  calorieEstimationUnavailableReason,
  estimateDayCaloriesBatch,
} from "@/lib/vertex-day-calories";

const foodEntryCalorieSelect = {
  rawText: true,
  quantity: true,
  unit: true,
} as const;

export default async function HistoryPage() {
  const user = await getOrCreateAppUser();
  if (!user) {
    redirect("/login");
  }

  let days;
  try {
    days = await prisma.daySession.findMany({
      where: { userId: user.id },
      orderBy: { localDate: "desc" },
      include: {
        dailySummary: { select: dailySummarySelectFull },
        foodEntries: { select: foodEntryCalorieSelect },
      },
    });
  } catch (e) {
    if (!isAiSummaryColumnsMissingError(e)) throw e;
    days = await prisma.daySession.findMany({
      where: { userId: user.id },
      orderBy: { localDate: "desc" },
      include: {
        dailySummary: { select: dailySummarySelectWithoutAi },
        foodEntries: { select: foodEntryCalorieSelect },
      },
    });
  }

  let kcalByDate = new Map<string, number>();
  try {
    kcalByDate = await estimateDayCaloriesBatch(
      days.map((d) => ({
        localDate: d.localDate,
        meals: d.foodEntries.map((e) => ({
          rawText: e.rawText,
          quantity: e.quantity,
          unit: e.unit,
        })),
      })),
    );
  } catch (err) {
    console.error("[history] estimateDayCaloriesBatch:", err);
  }

  const calorieSetupReason = calorieEstimationUnavailableReason();
  const anyDayMissingKcal = days.some(
    (d) => d.foodEntries.length > 0 && !kcalByDate.has(d.localDate),
  );
  const calorieBannerMessage =
    anyDayMissingKcal ?
      calorieSetupReason ??
      "Calorie estimates use Gemini (Google AI Studio or Vertex). This request failed or returned incomplete data — check server logs."
    : null;

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
          <div>
            <h1 className="font-serif text-xl font-semibold text-brandcolor-text-strong">
              History
            </h1>
            <p className="mt-1 text-sm text-brandcolor-text-weak">
              Recent days (newest first). Closed days include a saved summary.
            </p>
          </div>
          {calorieBannerMessage ?
            <HistoryCalorieBanner message={calorieBannerMessage} />
          : null}
          <ul className="flex flex-col gap-2">
            {days.map((d) => {
              const kcal = kcalByDate.get(d.localDate);
              const kcalSuffix =
                kcal !== undefined ?
                  ` · ~${kcal.toLocaleString()} kcal`
                : ` · — kcal`;
              return (
                <li key={d.id}>
                  <Link
                    href={`/history/${d.localDate}`}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white px-4 py-3 text-sm text-brandcolor-text-strong hover:bg-brandcolor-fill"
                  >
                    <span className="font-medium">
                      {formatWeekdayMonthDayForLocalDateKey(d.localDate, user.timezone)}
                    </span>
                    <span className="text-right text-brandcolor-text-weak">
                      {d.status === "CLOSED" ? "Closed" : "Active"} · {d.foodEntries.length}{" "}
                      meal(s)
                      {kcalSuffix}
                      {d.dailySummary ? " · summary" : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {days.length > 0 && (
            <div className="pt-1">
              <HistoryPeriodSummary dayCount={days.length} />
            </div>
          )}
          {days.length === 0 && (
            <p className="text-sm text-brandcolor-text-weak">
              No days yet. Start logging from{" "}
              <Link className="text-brandcolor-primary hover:underline" href="/chat">
                Chat
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

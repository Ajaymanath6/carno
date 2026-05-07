import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/user";
import {
  dailySummarySelectFull,
  dailySummarySelectWithoutAi,
  isAiSummaryColumnsMissingError,
} from "@/lib/prisma-daily-summary-fallback";
import { redirect } from "next/navigation";
import { HistoryPeriodSummary } from "@/components/history/HistoryPeriodSummary";
import { HistoryCalorieBanner } from "@/components/history/HistoryCalorieBanner";
import { HistoryDayList } from "@/components/history/HistoryDayList";
import {
  calorieEngineUsesVertex,
  resolveCalorieEngine,
} from "@/lib/calories-reference";
import { calorieEstimationUnavailableReason } from "@/lib/vertex-day-calories";

export const maxDuration = 60;

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
        foodEntries: {
          select: { id: true },
        },
      },
    });
  } catch (e) {
    if (!isAiSummaryColumnsMissingError(e)) throw e;
    days = await prisma.daySession.findMany({
      where: { userId: user.id },
      orderBy: { localDate: "desc" },
      include: {
        dailySummary: { select: dailySummarySelectWithoutAi },
        foodEntries: {
          select: { id: true },
        },
      },
    });
  }

  const calorieEngine = resolveCalorieEngine();
  const vertexUnavailable =
    calorieEngine === "vertex" ? calorieEstimationUnavailableReason() : null;
  const skipCalorieFetch = calorieEngine === "vertex" && Boolean(vertexUnavailable);

  const rows = days.map((d) => ({
    id: d.id,
    localDate: d.localDate,
    status: d.status,
    mealCount: d.foodEntries.length,
    hasSummary: Boolean(d.dailySummary),
  }));

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
          {calorieEngine === "vertex" && vertexUnavailable ?
            <HistoryCalorieBanner message={vertexUnavailable} />
          : null}
          {days.length === 0 ?
            <p className="text-sm text-brandcolor-text-weak">
              No days yet. Start logging from{" "}
              <Link className="text-brandcolor-primary hover:underline" href="/chat">
                Chat
              </Link>
              .
            </p>
          : <>
              <HistoryDayList
                rows={rows}
                timezone={user.timezone}
                calorieEngine={calorieEngine}
                skipCalorieFetch={skipCalorieFetch}
              />
              <div className="pt-1">
                <HistoryPeriodSummary dayCount={days.length} />
              </div>
            </>
          }
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatWeekdayMonthDayForLocalDateKey } from "@/lib/date";

export type HistoryDayListRow = {
  id: string;
  localDate: string;
  status: "ACTIVE" | "CLOSED";
  mealCount: number;
  hasSummary: boolean;
};

type Props = {
  rows: HistoryDayListRow[];
  /** User timezone from DB; invalid values fall back safely in formatters. */
  timezone: string;
  /** When true, skip fetch (AI not configured — server already showed banner). */
  skipCalorieFetch: boolean;
};

export function HistoryDayList({ rows, timezone, skipCalorieFetch }: Props) {
  const [kcalByDate, setKcalByDate] = useState<Record<string, number> | null>(
    skipCalorieFetch ? {} : null,
  );
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    if (skipCalorieFetch) {
      setKcalByDate({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/history/calorie-totals", {
          method: "GET",
          credentials: "same-origin",
        });
        if (!res.ok) {
          if (!cancelled) {
            setFetchFailed(true);
            setKcalByDate({});
          }
          return;
        }
        const data = (await res.json()) as { kcalByDate?: Record<string, number> };
        if (!cancelled) {
          setKcalByDate(data.kcalByDate ?? {});
        }
      } catch {
        if (!cancelled) {
          setFetchFailed(true);
          setKcalByDate({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skipCalorieFetch]);

  return (
    <>
      {fetchFailed ?
        <p className="text-sm text-brandcolor-text-weak" role="status">
          Could not load calorie estimates (timeout or server error). Totals show “—” — check
          Vercel logs and{" "}
          <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs">GEMINI_API_KEY</code>.
        </p>
      : null}
      <ul className="flex flex-col gap-2">
        {rows.map((d) => {
          const kcal =
            kcalByDate === null ? undefined : kcalByDate[d.localDate];
          const loadingCal =
            !skipCalorieFetch && kcalByDate === null && d.mealCount > 0;
          const kcalSuffix =
            loadingCal ? ` · … kcal`
            : kcal !== undefined ?
              ` · ~${kcal.toLocaleString()} kcal`
            : ` · — kcal`;

          return (
            <li key={d.id}>
              <Link
                href={`/history/${d.localDate}`}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white px-4 py-3 text-sm text-brandcolor-text-strong hover:bg-brandcolor-fill"
              >
                <span className="font-medium">
                  {formatWeekdayMonthDayForLocalDateKey(d.localDate, timezone)}
                </span>
                <span className="text-right text-brandcolor-text-weak">
                  {d.status === "CLOSED" ? "Closed" : "Active"} · {d.mealCount} meal(s)
                  {kcalSuffix}
                  {d.hasSummary ? " · summary" : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

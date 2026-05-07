"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DAILY_KCAL_NEED, type CalorieDaySource, type CalorieEngine } from "@/lib/calories-reference";
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
  /** Server-resolved CALORIE_ENGINE — drives loading copy. */
  calorieEngine: CalorieEngine;
  /** Skip fetch only when AI is unavailable in Vertex-only mode. */
  skipCalorieFetch: boolean;
};

const CALORIE_FETCH_TIMEOUT_MS = 55_000;

function calorieLoadingHint(engine: CalorieEngine): string {
  if (engine === "reference") {
    return "Computing calculator totals from reference energy densities (no LLM). Add grams and food keywords for coverage.";
  }
  if (engine === "reference_then_vertex") {
    return "Computing calculator totals first; optional AI can fill days that aren’t fully covered (if configured).";
  }
  return "Loading AI calorie totals…";
}

export function HistoryDayList({
  rows,
  timezone,
  calorieEngine,
  skipCalorieFetch,
}: Props) {
  const [kcalByDate, setKcalByDate] = useState<Record<string, number> | null>(
    skipCalorieFetch ? {} : null,
  );
  const [sourceByDate, setSourceByDate] = useState<
    Record<string, CalorieDaySource | undefined>
  >({});
  const [fetchFailed, setFetchFailed] = useState(false);
  const [fetchTimedOut, setFetchTimedOut] = useState(false);
  const [fetchDiagnostic, setFetchDiagnostic] = useState<string | null>(null);

  const waitingOnCalories =
    !skipCalorieFetch && kcalByDate === null && rows.some((r) => r.mealCount > 0);

  useEffect(() => {
    if (skipCalorieFetch) {
      setKcalByDate({});
      setSourceByDate({});
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CALORIE_FETCH_TIMEOUT_MS);

    (async () => {
      try {
        const res = await fetch("/api/history/calorie-totals", {
          method: "GET",
          credentials: "same-origin",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const payload = (await res.json().catch(() => ({}))) as {
          diagnostic?: string;
          kcalByDate?: Record<string, number>;
          sourceByDate?: Record<string, CalorieDaySource>;
        };
        if (!res.ok) {
          if (!cancelled) {
            setFetchFailed(true);
            setFetchDiagnostic(
              typeof payload.diagnostic === "string" ? payload.diagnostic : null,
            );
            setKcalByDate({});
            setSourceByDate({});
          }
          return;
        }
        if (!cancelled) {
          setFetchDiagnostic(null);
          setKcalByDate(payload.kcalByDate ?? {});
          setSourceByDate(payload.sourceByDate ?? {});
        }
      } catch (e) {
        clearTimeout(timeoutId);
        if (cancelled) return;
        const aborted =
          e instanceof DOMException && e.name === "AbortError";
        if (aborted) {
          setFetchTimedOut(true);
        } else {
          setFetchFailed(true);
        }
        setFetchDiagnostic(null);
        setKcalByDate({});
        setSourceByDate({});
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [skipCalorieFetch]);

  return (
    <>
      {waitingOnCalories ?
        <p className="text-xs leading-relaxed text-brandcolor-text-weak" aria-live="polite">
          {calorieLoadingHint(calorieEngine)}
        </p>
      : null}
      {fetchFailed || fetchTimedOut ?
        <p className="text-sm text-brandcolor-text-weak" role="status">
          {fetchTimedOut ?
            `Calorie request timed out after ${Math.round(CALORIE_FETCH_TIMEOUT_MS / 1000)}s — showing “—”. `
          : "Could not load calorie totals — showing “—”. "}
          Check logs for{" "}
          <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs">
            [api/history/calorie-totals]
          </code>
          . Confirm{" "}
          <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs">CALORIE_ENGINE</code>{" "}
          ({calorieEngine}) matches your intent; calculator mode needs grams + food keywords; AI
          mode needs credentials per{" "}
          <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs">.env.example</code>.
        </p>
      : null}
      {fetchDiagnostic ?
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-brandcolor-strokeweak bg-brandcolor-fill p-3 font-mono text-[11px] leading-snug text-brandcolor-text-strong">
          {fetchDiagnostic}
        </pre>
      : null}
      <ul className="flex flex-col gap-2">
        {rows.map((d) => {
          const kcal =
            kcalByDate === null ? undefined : kcalByDate[d.localDate];
          const loadingCal =
            !skipCalorieFetch && kcalByDate === null && d.mealCount > 0;
          const src = sourceByDate[d.localDate];
          const srcTag =
            kcal !== undefined && src === "reference" ?
              " · calc"
            : kcal !== undefined && src === "vertex" ?
              " · AI"
            : "";
          const kcalSuffix =
            loadingCal ? ` · … kcal`
            : kcal !== undefined ?
              ` · ~${kcal.toLocaleString()} / ${DAILY_KCAL_NEED.toLocaleString()} kcal${srcTag}`
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

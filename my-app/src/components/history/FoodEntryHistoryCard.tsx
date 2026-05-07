"use client";

import Image from "next/image";
import type { ReactionEntry } from "@prisma/client";
import { ReactionMetricsGrid } from "@/components/reaction-metrics";
import { formatLogTimestamp } from "@/lib/date";
import { mealThumbPathForNormalizedFood } from "@/lib/meal-thumb";
import { reactionEntryToSnapshot } from "@/lib/reaction-summary";

type Props = {
  rawText: string;
  foodNameNormalized: string;
  loggedAt: Date;
  timezone: string;
  reactions: ReactionEntry[];
  /** Calculator or AI estimate; omit or undefined shows — */
  estimatedKcal?: number;
  calorieSource?: "reference" | "vertex";
};

export function FoodEntryHistoryCard({
  rawText,
  foodNameNormalized,
  loggedAt,
  timezone,
  reactions,
  estimatedKcal,
  calorieSource,
}: Props) {
  const thumb = mealThumbPathForNormalizedFood(foodNameNormalized);

  return (
    <li className="rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-3 text-sm">
      <div className="flex gap-3">
        {thumb ? (
          <Image
            src={thumb}
            alt=""
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 shrink-0 object-contain mix-blend-multiply"
          />
        ) : (
          <div
            className="h-10 w-10 shrink-0 rounded-lg bg-brandcolor-fill"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-brandcolor-text-strong">{rawText}</p>
          <p className="text-xs text-brandcolor-text-weak">
            {estimatedKcal !== undefined ?
              <>
                ~{estimatedKcal.toLocaleString()} kcal ·{" "}
                {calorieSource === "reference" ?
                  "calc"
                : calorieSource === "vertex" ?
                  "AI"
                : "est"}{" "}
                · Logged {formatLogTimestamp(loggedAt, timezone)}
              </>
            : <>
                — kcal · Logged {formatLogTimestamp(loggedAt, timezone)}
              </>
            }
          </p>
          {reactions.map((r) => (
            <div key={r.id} className="mt-2 space-y-2 border-t border-brandcolor-strokeweak pt-2">
              <ReactionMetricsGrid reaction={reactionEntryToSnapshot(r)} />
              <p className="text-xs text-brandcolor-text-weak">
                Same yesterday?{" "}
                {r.ateYesterdaySame == null ? "—" : r.ateYesterdaySame ? "yes" : "no"}
              </p>
              {r.notes?.trim() ? (
                <p className="rounded-xl bg-brandcolor-fill px-3 py-2 text-sm whitespace-pre-wrap text-brandcolor-text-strong">
                  Notes: {r.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </li>
  );
}

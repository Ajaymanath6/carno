import { getLocalHourInTimeZone } from "@/lib/date";

const THREE_H_MS = 3 * 60 * 60 * 1000;

/**
 * End-of-day AI summary should run when **either**:
 * - Local wall-clock hour is ≥ `localHourThreshold` (default 22, same idea as {@link EOD_PANEL_START_HOUR}), **or**
 * - It has been ≥ 3 hours since the latest activity on this day's logs (meal `loggedAt` or reaction `collectedAt`).
 *
 * Caller still enforces: session ACTIVE, at least one meal, no `aiArticle` yet (idempotent).
 */
export function shouldGenerateAiDailySummary(opts: {
  now: Date;
  timezone: string;
  /** Default: 22 — match evening panel hour. */
  localHourThreshold?: number;
  foodEntries: Array<{ loggedAt: Date; reactions: Array<{ collectedAt: Date }> }>;
}): boolean {
  const threshold = opts.localHourThreshold ?? 22;
  const hour = getLocalHourInTimeZone(opts.timezone, opts.now);
  const afterEvening = hour >= threshold;

  let lastMs = 0;
  for (const e of opts.foodEntries) {
    lastMs = Math.max(lastMs, e.loggedAt.getTime());
    for (const r of e.reactions) {
      lastMs = Math.max(lastMs, r.collectedAt.getTime());
    }
  }
  if (lastMs === 0) {
    return false;
  }
  const threeHoursAfterActivity = opts.now.getTime() >= lastMs + THREE_H_MS;

  return afterEvening || threeHoursAfterActivity;
}

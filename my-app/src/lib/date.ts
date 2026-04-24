/** First local wall-clock hour (0–23) when the end-of-day summary panel may appear. */
export const EOD_PANEL_START_HOUR = 22;

/**
 * Local wall-clock hour (0–23) for `date` in IANA `timeZone`.
 * Used for UI that should follow the user's saved timezone (e.g. evening panels).
 */
export function getLocalHourInTimeZone(timeZone: string, date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  const raw = parts.find((p) => p.type === "hour")?.value ?? "0";
  const hour = parseInt(raw, 10);
  if (Number.isNaN(hour)) {
    return 0;
  }
  // Some engines report midnight as 24 when hour12 is false.
  if (hour === 24) {
    return 0;
  }
  return hour;
}

/** Calendar date key YYYY-MM-DD in the user's IANA timezone. */
export function getLocalDateKey(timeZone: string, date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Shift a YYYY-MM-DD key by whole days (civil date, UTC noon anchor). */
export function shiftLocalDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utc = Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
  const shifted = new Date(utc + deltaDays * 86400000);
  const yy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

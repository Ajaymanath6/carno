/** First local wall-clock hour (0–23) when the end-of-day summary panel may appear. */
export const EOD_PANEL_START_HOUR = 22;

/**
 * Valid IANA zone, or `"UTC"` if missing / invalid (Intl throws RangeError otherwise — common production footgun).
 */
export function resolveSafeIanaTimeZone(timeZone: string): string {
  const tz = typeof timeZone === "string" ? timeZone.trim() : "";
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return "UTC";
  }
}

/**
 * Local wall-clock hour (0–23) for `date` in IANA `timeZone`.
 * Used for UI that should follow the user's saved timezone (e.g. evening panels).
 */
export function getLocalHourInTimeZone(timeZone: string, date: Date = new Date()): number {
  const tz = resolveSafeIanaTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
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
  const tz = resolveSafeIanaTimeZone(timeZone);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Full weekday name (e.g. "Monday") for a calendar `YYYY-MM-DD` key in `timeZone`.
 * Uses the same UTC-noon anchor as {@link shiftLocalDateKey} for stable civil dates.
 */
export function weekdayLongForLocalDateKey(dateKey: string, timeZone: string): string {
  const tz = resolveSafeIanaTimeZone(timeZone);
  const [y, m, d] = dateKey.split("-").map(Number);
  const utc = Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
  }).format(new Date(utc));
}

/** Human-readable calendar line, e.g. `Mon, Apr 27` for a `YYYY-MM-DD` key in `timeZone`. */
export function formatWeekdayMonthDayForLocalDateKey(dateKey: string, timeZone: string): string {
  const tz = resolveSafeIanaTimeZone(timeZone);
  const [y, m, d] = dateKey.split("-").map(Number);
  const utc = Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(utc));
}

/** Compact range for period summaries, e.g. `Mon, Jan 1 – Wed, Jan 7`. */
export function formatPeriodDateRangeLabel(
  firstKey: string | undefined,
  lastKey: string | undefined,
  timeZone: string,
): string {
  const tz = resolveSafeIanaTimeZone(timeZone);
  if (!firstKey?.trim() || !lastKey?.trim()) {
    return "";
  }
  if (firstKey === lastKey) {
    return formatWeekdayMonthDayForLocalDateKey(firstKey, tz);
  }
  return `${formatWeekdayMonthDayForLocalDateKey(firstKey, tz)} – ${formatWeekdayMonthDayForLocalDateKey(lastKey, tz)}`;
}

/** Friendly log line in user TZ, e.g. `Mon, Apr 27, 7:07 AM`. */
export function formatLogTimestamp(loggedAt: Date, timeZone: string): string {
  const tz = resolveSafeIanaTimeZone(timeZone);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(loggedAt);
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

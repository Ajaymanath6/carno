import { getLocalHourInTimeZone } from "@/lib/date";

/** Salutation only from the user's local hour in `timezone` (mirrors chat onboarding). */
export function salutationForTimezone(timezone: string, now: Date = new Date()): string {
  const h = getLocalHourInTimeZone(timezone, now);
  if (h < 12) {
    return "Good morning";
  }
  if (h < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

/** e.g. `Good morning, Alex` using the user's local hour in `timezone`. */
export function timeGreetingLine(displayName: string, timezone: string, now: Date = new Date()): string {
  return `${salutationForTimezone(timezone, now)}, ${displayName}`;
}

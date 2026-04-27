import { getLocalHourInTimeZone } from "@/lib/date";

/** e.g. `Good morning, Alex` using the user's local hour in `timezone`. */
export function timeGreetingLine(displayName: string, timezone: string, now: Date = new Date()): string {
  const h = getLocalHourInTimeZone(timezone, now);
  let salutation = "Good evening";
  if (h < 12) {
    salutation = "Good morning";
  } else if (h < 17) {
    salutation = "Good afternoon";
  }
  return `${salutation}, ${displayName}`;
}

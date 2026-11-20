// All "today" logic uses one time zone, so the server (UTC on Vercel) and the browser agree.
// Keep in sync with the time zone in supabase/migrations (follow-up task due dates).
export const APP_TIME_ZONE = "America/Los_Angeles";

/** Today's date as YYYY-MM-DD in the app's time zone. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Adds days to a YYYY-MM-DD date. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** "Nov 20" from YYYY-MM-DD, without time zone shifts. */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "Today", "Tomorrow", "Yesterday", "3 days overdue" or "Nov 20". */
export function relativeDue(isoDate: string, today: string): string {
  if (isoDate === today) return "Today";
  if (isoDate === addDays(today, 1)) return "Tomorrow";
  if (isoDate === addDays(today, -1)) return "Yesterday";
  if (isoDate < today) {
    const days = Math.round((Date.parse(today) - Date.parse(isoDate)) / 86_400_000);
    return `${days} days overdue`;
  }
  return formatDate(isoDate);
}

/** Long form for headings, e.g. "Friday, November 20". */
export function longToday(): string {
  return new Date().toLocaleDateString("en-US", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** "Nov 20" (plus the year if it's not this year) for a timestamp, in the app's time zone. */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const sameYear =
    date.toLocaleDateString("en-US", { timeZone: APP_TIME_ZONE, year: "numeric" }) ===
    new Date().toLocaleDateString("en-US", { timeZone: APP_TIME_ZONE, year: "numeric" });
  return date.toLocaleDateString("en-US", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

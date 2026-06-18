import type { WeekendInfo } from "@/lib/types";

/** How far ahead the weekend list runs. The single knob for the window. */
export const WEEKEND_WINDOW_MONTHS = 6;

/** A weekend = Friday → Sunday, keyed by the Friday's date. */
const WEEKEND_LENGTH_DAYS = 2; // Fri (+0) .. Sun (+2)

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** yyyy-mm-dd in UTC (matches the Postgres `date` column representation). */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Build a UTC date from a local calendar date (so day granularity is stable). */
function utcDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function label(friday: Date): string {
  const sunday = new Date(friday);
  sunday.setUTCDate(friday.getUTCDate() + WEEKEND_LENGTH_DAYS);

  const fMonth = MONTHS[friday.getUTCMonth()];
  const sMonth = MONTHS[sunday.getUTCMonth()];
  const fDay = friday.getUTCDate();
  const sDay = sunday.getUTCDate();

  return fMonth === sMonth
    ? `${fMonth} ${fDay}–${sDay}`
    : `${fMonth} ${fDay} – ${sMonth} ${sDay}`;
}

/**
 * Generate the rolling list of upcoming weekends (this week's Friday onward),
 * spanning WEEKEND_WINDOW_MONTHS. Deterministic given `from`.
 */
export function generateWeekends(
  from: Date = new Date(),
  months: number = WEEKEND_WINDOW_MONTHS,
): WeekendInfo[] {
  const cursor = utcDateOnly(from);
  // advance to the upcoming Friday (getUTCDay: 0=Sun..6=Sat, Fri=5)
  const daysUntilFriday = (5 - cursor.getUTCDay() + 7) % 7;
  cursor.setUTCDate(cursor.getUTCDate() + daysUntilFriday);

  const end = utcDateOnly(from);
  end.setUTCMonth(end.getUTCMonth() + months);

  const weekends: WeekendInfo[] = [];
  while (cursor <= end) {
    weekends.push({ start: toISODate(cursor), label: label(cursor) });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return weekends;
}

/** Display name of the month a weekend's Friday falls in, e.g. "June 2026". */
export function weekendMonthGroup(startISO: string): string {
  const d = new Date(`${startISO}T00:00:00Z`);
  const full = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][d.getUTCMonth()];
  return `${full} ${d.getUTCFullYear()}`;
}

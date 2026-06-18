"use client";

import { useMemo, useSyncExternalStore } from "react";
import AvatarStack from "@/components/AvatarStack";
import type { CurrentUser } from "@/lib/auth";
import type { Voter, WeekendInfo } from "@/lib/types";
import styles from "./CalendarView.module.css";

/** The user's machine-local date as "yyyy-mm-dd" (matches iso(y,m,day)). */
function localTodayKey(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const noopSubscribe = () => () => {};

type Props = {
  weekends: WeekendInfo[];
  available: Record<string, Voter[]>;
  currentUser: CurrentUser | null;
  onToggle: (weekendStart: string, makeAvailable: boolean) => void;
};

const WEEKDAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const FRIDAY_COL = 4; // index of Friday within a Monday-indexed week row
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function iso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

/** Monday-indexed weekday: Mon=0 .. Sun=6. */
function mondayIndex(year: number, month: number, day: number): number {
  return (new Date(Date.UTC(year, month, day)).getUTCDay() + 6) % 7;
}

/** The Friday-key of the weekend a Fri/Sat/Sun belongs to, else null. */
function weekendKeyFor(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month, day));
  const wd = date.getUTCDay(); // 0 Sun .. 6 Sat
  const fridayOffset = wd === 5 ? 0 : wd === 6 ? -1 : wd === 0 ? -2 : null;
  if (fridayOffset === null) return null;
  date.setUTCDate(date.getUTCDate() + fridayOffset);
  return date.toISOString().slice(0, 10);
}

export default function CalendarView({
  weekends,
  available,
  currentUser,
  onToggle,
}: Props) {
  // the user's machine-local "today" for the marker. Server snapshot is null
  // so SSR/timezone differences can't cause a hydration mismatch; the real date
  // resolves on the client right after hydration.
  const todayKey = useSyncExternalStore(noopSubscribe, localTodayKey, () => null);

  // valid (in-window) weekend Friday keys
  const keySet = useMemo(() => new Set(weekends.map((w) => w.start)), [weekends]);

  // months to render: from the first weekend's month to the last weekend's month
  const months = useMemo(() => {
    if (!weekends.length) return [];
    const first = weekends[0].start;
    const last = weekends[weekends.length - 1].start;
    let y = Number(first.slice(0, 4));
    let m = Number(first.slice(5, 7)) - 1;
    const ly = Number(last.slice(0, 4));
    const lm = Number(last.slice(5, 7)) - 1;
    const out: { y: number; m: number }[] = [];
    while (y < ly || (y === ly && m <= lm)) {
      out.push({ y, m });
      if (++m > 11) {
        m = 0;
        y++;
      }
    }
    return out;
  }, [weekends]);

  return (
    <div className={styles.calendar}>
      {months.map(({ y, m }) => {
        const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
        const leadingBlanks = mondayIndex(y, m, 1);

        // flat day cells, then chunked into Monday-aligned week rows so each
        // row can carry a trailing avatar column aligned to its weekend
        const cells: (number | null)[] = [
          ...Array.from({ length: leadingBlanks }, () => null),
          ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
        ];
        while (cells.length % 7 !== 0) cells.push(null);
        const weeks: (number | null)[][] = [];
        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

        return (
          <div key={`${y}-${m}`} className={styles.month}>
            <div className={styles.grid}>
              {/* month name, aligned to the day grid's left edge so it tracks
                  the centering (spans the 7 day columns) */}
              <h2 className={styles.title}>
                {MONTH_NAMES[m]} {y}
              </h2>

              <div className={styles.week}>
                {/* leading spacer column — mirrors the avatar column to center
                    the day grid when there's room */}
                <div />
                {WEEKDAY_HEADERS.map((h, i) => (
                  <div
                    key={h}
                    className={`${styles.head} ${i >= 4 ? styles.headWeekend : ""}`}
                  >
                    {h}
                  </div>
                ))}
                {/* spacer above the avatar column */}
                <div className={`${styles.head} ${styles.avatarCell}`} />
              </div>

              {weeks.map((week, wi) => {
                // the weekend that "belongs" to this row, by its Friday cell
                const friday = week[FRIDAY_COL];
                const rowKey =
                  friday !== null ? weekendKeyFor(y, m, friday) : null;
                const rowVoters =
                  rowKey && keySet.has(rowKey) ? available[rowKey] ?? [] : [];

                return (
                  <div key={wi} className={styles.week}>
                    {/* leading spacer column (centers the grid) */}
                    <div />
                    {week.map((day, idx) => {
                      if (day === null) {
                        return (
                          <div key={`b-${wi}-${idx}`} className={styles.cell} />
                        );
                      }

                      const key = weekendKeyFor(y, m, day);
                      const selectable = key !== null && keySet.has(key);
                      const isToday = todayKey === iso(y, m, day);

                      if (!selectable) {
                        return (
                          <div
                            key={iso(y, m, day)}
                            className={`${styles.cell} ${styles.day} ${
                              isToday ? styles.today : ""
                            }`}
                          >
                            {day}
                          </div>
                        );
                      }

                      const voters = available[key] ?? [];
                      const iAmFree = currentUser
                        ? voters.some((v) => v.id === currentUser.id)
                        : false;
                      const names = voters.map((v) => v.name).join(", ");

                      return (
                        <button
                          key={iso(y, m, day)}
                          className={`${styles.cell} ${styles.weekend} ${
                            iAmFree ? styles.free : ""
                          } ${isToday ? styles.today : ""}`}
                          onClick={() => onToggle(key, !iAmFree)}
                          title={names ? `Free: ${names}` : "No one yet"}
                          aria-pressed={iAmFree}
                        >
                          {day}
                        </button>
                      );
                    })}

                    {/* who's free this weekend, aligned to the row */}
                    <div className={styles.avatarCell}>
                      <AvatarStack voters={rowVoters} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

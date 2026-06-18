"use client";

import { useMemo } from "react";
import type { CurrentUser } from "@/lib/auth";
import type { Voter, WeekendInfo } from "@/lib/types";
import styles from "./CalendarView.module.css";

type Props = {
  weekends: WeekendInfo[];
  available: Record<string, Voter[]>;
  currentUser: CurrentUser | null;
  onToggle: (weekendStart: string, makeAvailable: boolean) => void;
};

const WEEKDAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
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
    <div>
      {months.map(({ y, m }) => {
        const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
        const leadingBlanks = mondayIndex(y, m, 1);
        const cells: (number | null)[] = [
          ...Array.from({ length: leadingBlanks }, () => null),
          ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
        ];

        return (
          <div key={`${y}-${m}`} className={styles.month}>
            <h2 className={styles.title}>
              {MONTH_NAMES[m]} {y}
            </h2>
            <div className={styles.grid}>
              {WEEKDAY_HEADERS.map((h, i) => (
                <div
                  key={h}
                  className={`${styles.head} ${i >= 4 ? styles.headWeekend : ""}`}
                >
                  {h}
                </div>
              ))}

              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`b-${idx}`} className={styles.cell} />;
                }

                const key = weekendKeyFor(y, m, day);
                const selectable = key !== null && keySet.has(key);

                if (!selectable) {
                  return (
                    <div key={iso(y, m, day)} className={`${styles.cell} ${styles.day}`}>
                      {day}
                    </div>
                  );
                }

                const voters = available[key] ?? [];
                const iAmFree = currentUser
                  ? voters.some((v) => v.id === currentUser.id)
                  : false;
                const names = voters.map((v) => v.name).join(", ");
                // one count per weekend: show it on the Friday cell only
                const isFriday = new Date(Date.UTC(y, m, day)).getUTCDay() === 5;

                return (
                  <button
                    key={iso(y, m, day)}
                    className={`${styles.cell} ${styles.weekend} ${
                      iAmFree ? styles.free : ""
                    }`}
                    onClick={() => onToggle(key, !iAmFree)}
                    title={names ? `Free: ${names}` : "No one yet"}
                    aria-pressed={iAmFree}
                  >
                    {day}
                    {isFriday && voters.length > 0 && (
                      <span className={styles.count}>{voters.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

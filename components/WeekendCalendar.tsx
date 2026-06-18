"use client";

import Button from "@/components/ui/Button";
import UserBadges from "@/components/UserBadges";
import { weekendMonthGroup } from "@/lib/weekends";
import type { CurrentUser } from "@/lib/auth";
import type { Voter, WeekendInfo } from "@/lib/types";
import styles from "./WeekendCalendar.module.css";

type Props = {
  weekends: WeekendInfo[];
  available: Record<string, Voter[]>;
  currentUser: CurrentUser | null;
  onToggle: (weekendStart: string, makeAvailable: boolean) => void;
};

export default function WeekendCalendar({
  weekends,
  available,
  currentUser,
  onToggle,
}: Props) {
  // group consecutive weekends by their month label
  const groups: { month: string; items: WeekendInfo[] }[] = [];
  for (const w of weekends) {
    const month = weekendMonthGroup(w.start);
    const last = groups[groups.length - 1];
    if (!last || last.month !== month) groups.push({ month, items: [w] });
    else last.items.push(w);
  }

  return (
    <div>
      {groups.map((g) => (
        <div key={g.month} className={styles.group}>
          <h2 className={styles.month}>{g.month}</h2>
          {g.items.map((w) => {
            const voters = available[w.start] ?? [];
            const iAmFree = currentUser
              ? voters.some((v) => v.id === currentUser.id)
              : false;
            return (
              <div key={w.start} className={styles.row}>
                <span className={styles.label}>{w.label}</span>
                {voters.length > 0 ? (
                  <span className={styles.names}>
                    <UserBadges voters={voters} />
                  </span>
                ) : (
                  <span className={styles.none}>No one yet</span>
                )}
                <Button
                  small
                  variant={iAmFree ? "success" : "default"}
                  onClick={() => onToggle(w.start, !iAmFree)}
                >
                  I&apos;m free
                </Button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

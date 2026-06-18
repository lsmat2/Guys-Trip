import Card from "@/components/ui/Card";
import AvatarStack from "@/components/AvatarStack";
import type { Voter, WeekendInfo } from "@/lib/types";
import styles from "./TopWeekend.module.css";

/** A weekend with its available crew, for the home dashboard. */
export default function TopWeekend({
  weekend,
  voters,
}: {
  weekend: WeekendInfo;
  voters: Voter[];
}) {
  return (
    <Card>
      <div className={styles.label}>{weekend.label}</div>
      <div className={styles.meta}>
        <span className={styles.count}>{voters.length} available</span>
        <AvatarStack voters={voters} />
      </div>
    </Card>
  );
}

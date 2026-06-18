import { UserBadge } from "@/components/UserBadges";
import type { Voter } from "@/lib/types";
import styles from "./AvatarStack.module.css";

type Props = {
  voters: Voter[];
  /** how many avatars to show before condensing the rest into a "+N" chip */
  max?: number;
};

/**
 * Overlapping row of avatars with overflow condensed to a "+N" chip. Reuses
 * UserBadge so each avatar keeps the same name-on-hover/tap behavior as
 * everywhere else. Renders nothing when empty.
 */
export default function AvatarStack({ voters, max = 8 }: Props) {
  if (voters.length === 0) return null;

  const overflow = voters.length > max ? voters.length - (max - 1) : 0;
  const shown = overflow ? voters.slice(0, max - 1) : voters;

  return (
    <span className={styles.stack}>
      {shown.map((v) => (
        <UserBadge
          key={v.id}
          name={v.name}
          className={styles.item}
          avatarClassName={styles.ring}
        />
      ))}
      {overflow > 0 && (
        <span className={styles.more} title={`${overflow} more`}>
          +{overflow}
        </span>
      )}
    </span>
  );
}

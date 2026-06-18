import Avatar from "@/components/ui/Avatar";
import type { Voter } from "@/lib/types";
import styles from "./AvatarStack.module.css";

type Props = {
  voters: Voter[];
  /** how many avatars to show before condensing the rest into a "+N" chip */
  max?: number;
};

/**
 * Overlapping row of avatars with overflow condensed to a "+N" chip.
 * Names surface via native tooltip on hover. Renders nothing when empty.
 */
export default function AvatarStack({ voters, max = 8 }: Props) {
  if (voters.length === 0) return null;

  const overflow = voters.length > max ? voters.length - (max - 1) : 0;
  const shown = overflow ? voters.slice(0, max - 1) : voters;

  return (
    <span className={styles.stack}>
      {shown.map((v) => (
        <Avatar
          key={v.id}
          name={v.name}
          title={v.name}
          tabIndex={-1}
          className={styles.item}
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

"use client";

import Avatar from "@/components/ui/Avatar";
import HoverTip from "@/components/ui/HoverTip";
import type { Voter } from "@/lib/types";
import styles from "./UserBadges.module.css";

/**
 * A single circular avatar (first letter); shows the full name on hover/tap.
 * `className` styles the wrapper and `avatarClassName` the avatar itself, so
 * callers (e.g. AvatarStack) can overlap/ring them without forking the tooltip.
 */
export function UserBadge({
  name,
  className,
  avatarClassName,
}: {
  name: string;
  className?: string;
  avatarClassName?: string;
}) {
  return (
    <HoverTip label={name} className={className}>
      <Avatar name={name} className={avatarClassName} aria-label={name} />
    </HoverTip>
  );
}

/** A row of avatar badges for a set of users. */
export default function UserBadges({ voters }: { voters: Voter[] }) {
  return (
    <span className={styles.row}>
      {voters.map((v) => (
        <UserBadge key={v.id} name={v.name} />
      ))}
    </span>
  );
}

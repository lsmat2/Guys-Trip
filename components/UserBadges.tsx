"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import type { Voter } from "@/lib/types";
import styles from "./UserBadges.module.css";

/** ms a tapped name stays visible before auto-hiding (touch has no hover). */
const REVEAL_MS = 600;

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
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // tap reveals, then auto-hides — so it never "persists" like a toggle
  function reveal() {
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), REVEAL_MS);
  }

  return (
    <span className={`${styles.wrap} ${className ?? ""}`.trim()}>
      <Avatar
        name={name}
        className={avatarClassName}
        onClick={reveal}
        aria-label={name}
      />
      <span
        className={`${styles.tip} ${open ? styles.open : ""}`}
        role="tooltip"
      >
        {name}
      </span>
    </span>
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

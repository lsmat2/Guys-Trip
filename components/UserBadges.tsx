"use client";

import { useState } from "react";
import type { Voter } from "@/lib/types";
import styles from "./UserBadges.module.css";

/** A single circular avatar (first letter); shows the full name on hover/tap. */
export function UserBadge({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const letter = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span className={styles.wrap}>
      <button
        type="button"
        className={styles.badge}
        onClick={() => setOpen((o) => !o)}
        aria-label={name}
      >
        {letter}
      </button>
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

"use client";

import styles from "./VoteButtons.module.css";

type Props = {
  upCount: number;
  downCount: number;
  /** the current user's vote: 1, -1, or 0 (none) */
  myVote: 0 | 1 | -1;
  onVote: (value: 1 | -1) => void;
};

export default function VoteButtons({ upCount, downCount, myVote, onVote }: Props) {
  return (
    <div className={styles.row}>
      <button
        className={`${styles.btn} ${styles.up} ${myVote === 1 ? styles.active : ""}`}
        onClick={() => onVote(1)}
        aria-pressed={myVote === 1}
        aria-label="Upvote"
      >
        ▲ <span className={styles.count}>{upCount}</span>
      </button>
      <button
        className={`${styles.btn} ${styles.down} ${myVote === -1 ? styles.active : ""}`}
        onClick={() => onVote(-1)}
        aria-pressed={myVote === -1}
        aria-label="Downvote"
      >
        ▼ <span className={styles.count}>{downCount}</span>
      </button>
    </div>
  );
}

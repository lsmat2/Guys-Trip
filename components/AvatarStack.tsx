"use client";

import { useEffect, useRef, useState } from "react";
import { UserBadge } from "@/components/UserBadges";
import HoverTip from "@/components/ui/HoverTip";
import type { Voter } from "@/lib/types";
import styles from "./AvatarStack.module.css";

// avatar geometry, kept in sync with the CSS (24px circles overlapping by 7px)
const AVATAR_W = 24;
const AVATAR_STEP = 17;
const MIN_SLOTS = 2; // floor: 1 real avatar + the "+N" counter chip

/** how many avatars fit in `width` px. */
function fitSlots(width: number): number {
  return Math.max(MIN_SLOTS, Math.floor((width - AVATAR_W) / AVATAR_STEP) + 1);
}

type Props = {
  voters: Voter[];
  /** fixed cap; omit to auto-fit the parent's width (collapsing as it shrinks) */
  max?: number;
};

/**
 * Overlapping row of avatars with overflow condensed into a "+N" chip that
 * reveals the hidden users' names (same tooltip as the avatars). When `max` is
 * omitted the stack measures its parent and collapses/expands fluidly down to a
 * floor of 1 avatar + the chip, so it never grows its container. Reused by the
 * calendar grid, the weekend list, and the dashboard.
 */
export default function AvatarStack({ voters, max }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState(MIN_SLOTS);
  const hasVoters = voters.length > 0;

  useEffect(() => {
    if (max !== undefined || !hasVoters) return;
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const measure = () => {
      const cs = getComputedStyle(parent);
      const padX =
        (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      setFit(fitSlots(parent.clientWidth - padX - 4)); // -4: small right buffer
    };
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    measure();
    return () => ro.disconnect();
  }, [max, hasVoters]);

  if (!hasVoters) return null;

  const limit = max ?? fit;
  const overflow = voters.length > limit ? voters.length - (limit - 1) : 0;
  const shown = overflow ? voters.slice(0, limit - 1) : voters;
  const hidden = overflow ? voters.slice(limit - 1) : [];

  return (
    <span className={styles.stack} ref={ref}>
      {shown.map((v) => (
        <UserBadge
          key={v.id}
          name={v.name}
          className={styles.item}
          avatarClassName={styles.ring}
        />
      ))}
      {overflow > 0 && (
        <HoverTip
          label={
            <span className={styles.names}>
              {hidden.map((v) => (
                <span key={v.id} className={styles.name}>
                  {v.name}
                </span>
              ))}
            </span>
          }
          className={styles.moreItem}
          align="end"
        >
          <button type="button" className={styles.more}>
            +{overflow}
          </button>
        </HoverTip>
      )}
    </span>
  );
}
